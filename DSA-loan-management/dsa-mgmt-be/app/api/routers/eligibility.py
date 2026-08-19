from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.eligibility import EligibilityResponse
from app.services.mcp_eligibility_tool import (
    execute_mcp_eligibility_tool,
    generate_ai_explanation,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/evaluate", response_model=EligibilityResponse)
def evaluate_eligibility(
    applicationId: int = Query(..., description="ID of the loan application to evaluate"),
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
    raw_result = execute_mcp_eligibility_tool(db=db, application_id=applicationId)
    
    if raw_result.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=raw_result.get("message", "Application not found"))

    # Generate Groq AI / Rule-based natural language explanation
    ai_summary = generate_ai_explanation(raw_result)
    raw_result["aiExplanation"] = ai_summary

    return raw_result
