from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.schemas.comparison import BankComparisonResponse
from app.services.mcp_comparison_tool import execute_mcp_comparison_tool
from app.core.security import require_role, CurrentUser

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/banks", response_model=BankComparisonResponse)
def compare_banks(
    applicationId: int = Query(..., description="ID of the loan application"),
    bankIds: str = Query(..., description="Comma-separated bank IDs to compare (e.g. '1,2'). Max 2 banks."),
    userRole: Optional[str] = Query(None, description="Optional user role override (defaults to authenticated token role)"),
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Compares up to 2 banks for an application:
    - Verifies product linking & policy document presence.
    - Evaluates CIBIL-to-ROI, tenure, loan amount, proposed EMI.
    - Computes Property & Applicant Insurance, Processing fee, and DSA commissions (agent/admin only).
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

    # Secure role determination from validated JWT token
    effective_role = current_user.role

    return execute_mcp_comparison_tool(
        db=db,
        application_id=applicationId,
        bank_ids=parsed_bank_ids,
        user_role=effective_role,
    )
