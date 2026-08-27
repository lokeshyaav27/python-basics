from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.loan_application import LoanApplication
from app.mcp.auth import check_auth_permission


COMPARE_BANK_OFFERS_SPEC = {
    "name": "compare_bank_offers",
    "description": (
        "Generates a multi-bank comparative evaluation matrix across all partner banks for a specific loan application. "
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
                "description": "Optional specific list of bank IDs to compare. If omitted, automatically evaluates ALL partner banks offering this loan product.",
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
    Executes the multi-bank comparison engine as an MCP tool across all partner banks.
    """
    from app.services.comparison.engine import compare_banks_for_application
    from app.models.product_bank_link import ProductBankLink
    from app.models.bank import Bank

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
        # Fetch all active partner banks linked to this product
        links = (
            db.query(ProductBankLink)
            .filter(ProductBankLink.productId == app.productId, ProductBankLink.isActive != False)
            .all()
        )
        selected_bank_ids = [l.bankId for l in links if l.bankId]
        if not selected_bank_ids and app.bankId:
            selected_bank_ids = [app.bankId]

    if not selected_bank_ids:
        all_active_banks = db.query(Bank).filter(Bank.isActive != False).all()
        selected_bank_ids = [b.id for b in all_active_banks]

    role = user_role or (auth_user.get("role") if auth_user else "customer")
    raw_result = compare_banks_for_application(
        db=db,
        application_id=application_id,
        bank_ids=selected_bank_ids,
        user_role=role,
    )

    # Sanitize and compact bank offers for optimal LLM context size and token efficiency
    is_agent_or_admin = role in ["agent", "admin"]
    compact_banks = []
    for b in raw_result.get("banks", []):
        bank_entry = {
            "bankId": b.get("bankId"),
            "bankName": b.get("bankName"),
            "status": b.get("status"),
            "interestRatePct": b.get("interestRatePct") if b.get("interestRatePct") is not None else b.get("roi"),
            "monthlyEmi": b.get("monthlyEmi") if b.get("monthlyEmi") is not None else b.get("emi"),
            "maxEligibleAmount": b.get("loanAmount"),
            "tenureYears": b.get("tenureYears"),
            "processingFee": b.get("processingFee"),
            "insuranceAmount": b.get("insuranceAmount"),
            "femaleCoApplicantBenefit": b.get("benefitForFemaleCoApplicant"),
            "rejections": b.get("rejectionReasons", []),
        }
        if is_agent_or_admin:
            comm_pct = b.get("commissionPct")
            comm_amt = b.get("commissionAmount") or (b.get("dsaCommission", {}).get("commissionPayoutAmt") if isinstance(b.get("dsaCommission"), dict) else None)
            bank_entry["dsaCommissionPct"] = comm_pct
            bank_entry["dsaCommissionPayoutAmt"] = comm_amt

        compact_banks.append(bank_entry)

    return {
        "applicationId": raw_result.get("applicationId"),
        "customerName": raw_result.get("customerName"),
        "productName": raw_result.get("productName"),
        "requestedAmount": raw_result.get("requestedAmount"),
        "cibilScore": raw_result.get("cibilScore"),
        "totalBanksEvaluated": len(compact_banks),
        "banks": compact_banks,
    }

