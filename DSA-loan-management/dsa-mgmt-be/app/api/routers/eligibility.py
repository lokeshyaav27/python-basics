from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.schemas.eligibility import EligibilityResponse, EligibilityEvaluateRequest
from app.services.mcp_eligibility_tool import (
    execute_mcp_eligibility_tool,
    generate_ai_explanation,
    MCP_ELIGIBILITY_TOOL_SPEC,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/evaluate", response_model=EligibilityResponse)
def evaluate_eligibility_by_query(
    applicationId: int = Query(..., description="ID of the loan application to evaluate"),
    db: Session = Depends(get_db),
):
    """
    Evaluates loan applicant eligibility via query parameter:
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


@router.post("/evaluate", response_model=EligibilityResponse)
def evaluate_eligibility_by_post(
    req: Optional[EligibilityEvaluateRequest] = None,
    applicationId: Optional[int] = Query(None, description="Optional query parameter for application ID"),
    db: Session = Depends(get_db),
):
    """
    POST endpoint for evaluating loan eligibility (accepts JSON body or query param).
    """
    app_id = None
    if req and req.applicationId:
        app_id = req.applicationId
    elif applicationId is not None:
        app_id = applicationId

    if not app_id:
        raise HTTPException(status_code=400, detail="Missing applicationId parameter.")

    raw_result = execute_mcp_eligibility_tool(db=db, application_id=app_id)
    if raw_result.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=raw_result.get("message", "Application not found"))

    ai_summary = generate_ai_explanation(raw_result)
    raw_result["aiExplanation"] = ai_summary

    return raw_result


@router.get("/mcp-spec")
def get_mcp_tool_specification():
    """
    Returns standard Model Context Protocol (MCP) tool schema for loan eligibility.
    """
    return MCP_ELIGIBILITY_TOOL_SPEC
