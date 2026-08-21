from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.loan_application import LoanApplication
from app.mcp.auth import check_auth_permission


COMPARE_BANK_OFFERS_SPEC = {
    "name": "compare_bank_offers",
    "description": (
        "Generates a multi-bank comparative matrix for a specific loan application. "
        "Evaluates interest rates (ROI), maximum eligible loan amount, monthly EMI, total interest payable, "
        "processing fees, insurance requirements, and internal DSA payout commissions (visible only to Agent/Admin)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the loan application.",
            },
            "bank_ids": {
                "type": ["array", "null"],
                "items": {"type": "integer"},
                "description": "Optional list of bank IDs to compare (e.g. [1, 2]). If omitted, automatically selects partner banks offering this loan product.",
            },
            "user_role": {
                "type": ["string", "null"],
                "enum": ["agent", "admin", "customer"],
                "description": "Optional role override. Defaults to authenticated caller role.",
            },
        },
        "required": ["application_id"],
    },
}

COMPARISON_TOOL_SPEC = COMPARE_BANK_OFFERS_SPEC


def compare_bank_offers(
    db: Session,
    application_id: int,
    bank_ids: Optional[List[int]] = None,
    user_role: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes the multi-bank comparison engine as an MCP tool with role enforcement.
    """
    from app.services.comparison.engine import compare_banks_for_application
    from app.models.product_bank_link import ProductBankLink

    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Loan application #{application_id} not found.")

    check_auth_permission(
        auth_user,
        target_customer_id=app.uniqueCustomerId,
        target_agent_id=app.agentId,
        target_app=app,
    )

    selected_bank_ids = bank_ids or []
    if not selected_bank_ids:
        links = (
            db.query(ProductBankLink)
            .filter(ProductBankLink.productId == app.productId)
            .limit(2)
            .all()
        )
        selected_bank_ids = [l.bankId for l in links if l.bankId]
        if not selected_bank_ids and app.bankId:
            selected_bank_ids = [app.bankId]

    if not selected_bank_ids:
        selected_bank_ids = [1, 2]

    role = user_role or (auth_user.get("role") if auth_user else "customer")
    return compare_banks_for_application(
        db=db,
        application_id=application_id,
        bank_ids=selected_bank_ids[:2],
        user_role=role,
    )

