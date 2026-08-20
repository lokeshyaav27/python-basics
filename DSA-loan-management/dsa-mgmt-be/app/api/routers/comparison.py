from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.comparison_service import ComparisonService
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_comparison_service(db: Session = Depends(get_db)) -> ComparisonService:
    return ComparisonService(db)


@router.get("/banks")
def compare_banks(
    applicationId: int = Query(..., description="ID of the loan application"),
    bankIds: str = Query(..., description="Comma-separated bank IDs to compare (e.g. '1,2'). Max 2 banks."),
    userRole: Optional[str] = Query(None, description="Optional user role override"),
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    comparison_service: ComparisonService = Depends(get_comparison_service),
):
    result = comparison_service.compare_banks(
        application_id=applicationId,
        bank_ids_str=bankIds,
        current_user=current_user,
    )
    return success_response(
        result=result,
        message="Loan comparison completed successfully",
    )
