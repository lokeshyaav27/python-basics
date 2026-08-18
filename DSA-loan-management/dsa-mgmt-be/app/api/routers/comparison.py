from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import SessionLocal
from app.schemas.comparison import BankComparisonResponse, BankComparisonRequest
from app.services.mcp_comparison_tool import (
    execute_mcp_comparison_tool,
    MCP_COMPARISON_TOOL_SPEC,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/banks", response_model=BankComparisonResponse)
def compare_banks_get(
    applicationId: int = Query(..., description="ID of the loan application"),
    bankIds: str = Query(..., description="Comma-separated bank IDs to compare (e.g. '1,2'). Max 2 banks."),
    userRole: Optional[str] = Query("customer", description="User role ('agent', 'admin', or 'customer')"),
    db: Session = Depends(get_db),
):
    """
    Compares up to 2 banks for an application:
    - Verifies product linking & policy document presence.
    - Evaluates CIBIL-to-ROI, tenure, loan amount, proposed EMI.
    - Computes Property & Applicant Insurance, Processing fee, and DSA commissions (agent only).
    - Uses pgvector RAG for bank policy document rules and Groq for comparative analysis.
    """
    try:
        parsed_bank_ids = [int(bid.strip()) for bid in bankIds.split(",") if bid.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bankIds format. Provide comma-separated integers.")

    if len(parsed_bank_ids) > 2:
        raise HTTPException(status_code=400, detail="You cannot compare more than 2 banks at once.")
    if len(parsed_bank_ids) == 0:
        raise HTTPException(status_code=400, detail="Please select at least 1 bank to compare.")

    return execute_mcp_comparison_tool(
        db=db,
        application_id=applicationId,
        bank_ids=parsed_bank_ids,
        user_role=userRole or "customer",
    )


@router.post("/banks", response_model=BankComparisonResponse)
def compare_banks_post(
    req: BankComparisonRequest,
    userRole: Optional[str] = Query("customer", description="User role ('agent', 'admin', or 'customer')"),
    db: Session = Depends(get_db),
):
    """
    POST endpoint for comparing up to 2 banks.
    """
    if len(req.bankIds) > 2:
        raise HTTPException(status_code=400, detail="You cannot compare more than 2 banks at once.")

    return execute_mcp_comparison_tool(
        db=db,
        application_id=req.applicationId,
        bank_ids=req.bankIds,
        user_role=userRole or "customer",
    )


@router.get("/mcp-spec")
def get_comparison_mcp_spec():
    """
    Returns MCP tool specification for Compare Banks.
    """
    return MCP_COMPARISON_TOOL_SPEC
