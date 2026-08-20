from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.eligibility.engine import evaluate_loan_application


ELIGIBILITY_TOOL_SPEC = {
    "name": "check_loan_eligibility",
    "description": (
        "Evaluates applicant loan eligibility based on DSA underwriting standards, "
        "checking CIBIL score, FOIR debt-to-income ratio, property/vehicle LTV, "
        "age criteria, and product-specific caps for Home, Car, or Personal loans."
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
    Executes deterministic loan underwriting calculation as an MCP tool.
    """
    return evaluate_loan_application(db=db, application_id=application_id)
