from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from dsa_common.repositories import LoanApplicationRepository
from app.services.eligibility_service import EligibilityService
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_eligibility_service(db: Session = Depends(get_db)) -> EligibilityService:
    repo = LoanApplicationRepository(db)
    return EligibilityService(repo)


@router.get("/evaluate")
def evaluate_eligibility(
    applicationId: int = Query(..., description="ID of the loan application to evaluate"),
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    eligibility_service: EligibilityService = Depends(get_eligibility_service),
):
    result = eligibility_service.evaluate_eligibility(
        application_id=applicationId,
        current_user=current_user,
    )
    return success_response(
        result=result,
        message="Loan eligibility evaluated successfully",
    )
