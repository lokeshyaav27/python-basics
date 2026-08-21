from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.loan_application import LoanApplication
from app.mcp.auth import check_auth_permission


CHECK_LOAN_ELIGIBILITY_SPEC = {
    "name": "check_loan_eligibility",
    "description": (
        "Evaluates applicant loan eligibility based on DSA credit underwriting standards and bank policies. "
        "Calculates FOIR (debt-to-income ratio), LTV (loan-to-value), maximum eligible loan amount, monthly EMI, "
        "income surplus, positive underwriting factors, and specific reduction/rejection reasons."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the customer loan application.",
            }
        },
        "required": ["application_id"],
    },
}


def check_loan_eligibility(
    db: Session,
    application_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes deterministic credit underwriting calculation with role authorization.
    """
    from app.services.eligibility.engine import evaluate_loan_application

    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Loan application #{application_id} not found.")

    check_auth_permission(
        auth_user,
        target_customer_id=app.uniqueCustomerId,
        target_agent_id=app.agentId,
        target_app=app,
    )

    return evaluate_loan_application(db=db, application_id=application_id)
