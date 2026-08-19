from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.loan_application import LoanApplication
from app.services.mcp_eligibility_tool import (
    execute_mcp_eligibility_tool,
    generate_ai_explanation,
)
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/evaluate")
def evaluate_eligibility(
    applicationId: int = Query(..., description="ID of the loan application to evaluate"),
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Evaluates loan applicant eligibility:
    - Validates completeness of personal, financial, and product loan details.
    - If incomplete, returns missing fields so user is prompted to fill them.
    - If complete, runs product-specific rules (Home, Car, or Personal Loan)
      checking CIBIL, Age, Income, FOIR, LTV, EMI, and caps.
    - Attaches Groq AI (openai/gpt-oss-120b) natural language explanation.
    """
    # Verify customer ownership
    if current_user.role == "customer":
        app = db.query(LoanApplication).filter(LoanApplication.id == applicationId).first()
        if not app:
            raise HTTPException(status_code=404, detail="Loan application not found")
        is_owner = (
            app.id == current_user.id
            or (current_user.uniqueCustomerId and app.uniqueCustomerId == current_user.uniqueCustomerId)
            or (current_user.mobile and app.mobile == current_user.mobile)
        )
        if not is_owner:
            raise HTTPException(status_code=403, detail="Forbidden: You can only evaluate eligibility for your own loan application.")

    raw_result = execute_mcp_eligibility_tool(db=db, application_id=applicationId)
    
    if raw_result.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=raw_result.get("message", "Application not found"))

    # Generate Groq AI / Rule-based natural language explanation
    ai_summary = generate_ai_explanation(raw_result)
    raw_result["aiExplanation"] = ai_summary

    return success_response(
        result=raw_result,
        message="Loan eligibility evaluated successfully",
    )
