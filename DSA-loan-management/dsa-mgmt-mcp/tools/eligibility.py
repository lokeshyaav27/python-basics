from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac, enforce_record_ownership, MCPAuthError
from app.models.loan_application import LoanApplication
from app.services.eligibility.engine import evaluate_loan_application


def handle_check_loan_eligibility(
    application_id: int,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates applicant loan eligibility based on DSA credit underwriting standards and bank policies.
    Calculates FOIR (debt-to-income ratio), LTV (loan-to-value), maximum eligible loan amount, monthly EMI,
    income surplus, positive underwriting factors, and specific reduction/rejection reasons.
    """
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("check_loan_eligibility", user)

    with get_db_session() as db:
        app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
        if not app:
            raise ValueError(f"Loan application #{application_id} not found.")

        enforce_record_ownership(
            auth_user=user,
            target_customer_id=app.uniqueCustomerId,
            target_agent_id=app.agentId,
            target_app=app,
        )

        return evaluate_loan_application(db=db, application_id=application_id)
