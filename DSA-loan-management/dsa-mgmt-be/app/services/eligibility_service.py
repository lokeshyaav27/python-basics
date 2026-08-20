from typing import Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.loan_application_repository import LoanApplicationRepository
from app.services.eligibility.engine import evaluate_loan_application
from app.ai.explainer import generate_ai_explanation
from app.core.security import CurrentUser


class EligibilityService:
    def __init__(self, loan_app_repo: LoanApplicationRepository):
        self.loan_app_repo = loan_app_repo

    def evaluate_eligibility(
        self, application_id: int, current_user: CurrentUser
    ) -> Dict[str, Any]:
        # Verify customer ownership
        if current_user.role == "customer":
            app = self.loan_app_repo.get_by_id(application_id)
            if not app:
                raise HTTPException(status_code=404, detail="Loan application not found")
            is_owner = (
                app.id == current_user.id
                or (current_user.uniqueCustomerId and app.uniqueCustomerId == current_user.uniqueCustomerId)
                or (current_user.mobile and app.mobile == current_user.mobile)
            )
            if not is_owner:
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden: You can only evaluate eligibility for your own loan application.",
                )

        raw_result = evaluate_loan_application(db=self.loan_app_repo.db, application_id=application_id)

        if raw_result.get("status") == "ERROR":
            raise HTTPException(status_code=404, detail=raw_result.get("message", "Application not found"))

        ai_summary = generate_ai_explanation(raw_result)
        raw_result["aiExplanation"] = ai_summary
        return raw_result
