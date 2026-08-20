from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.services.comparison import compare_banks_for_application


COMPARISON_TOOL_SPEC = {
    "name": "compare_banks",
    "description": (
        "Compares loan terms, eligibility, interest rates (ROI), maximum loan amount, "
        "monthly EMI, tenure, female co-applicant benefits, insurance costs (property and applicant), "
        "processing fees, and DSA commissions across up to 2 partner banks for a specific loan application, "
        "referencing indexed bank policy documents in pgvector."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the loan application.",
            },
            "bank_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "List of bank IDs to compare. Maximum 2 banks allowed.",
                "maxItems": 2,
                "minItems": 1,
            },
            "user_role": {
                "type": "string",
                "enum": ["agent", "admin", "customer"],
                "description": "Role of the user. DSA commission is revealed ONLY for 'agent' or 'admin'.",
            },
        },
        "required": ["application_id", "bank_ids"],
    },
}


def compare_banks(
    db: Session,
    application_id: int,
    bank_ids: List[int],
    user_role: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes the multi-bank comparison engine as an MCP tool.
    """
    role = user_role or (auth_user.get("role") if auth_user else "customer")
    return compare_banks_for_application(
        db=db,
        application_id=application_id,
        bank_ids=bank_ids,
        user_role=role,
    )
