import logging
from typing import Dict, Any, List, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac, enforce_record_ownership
from dsa_common.models import LoanApplication, ProductBankLink, Bank
from dsa_common.services.comparison import compare_banks_for_application

logger = logging.getLogger("mcp_tools.comparison")


def handle_compare_bank_offers(
    application_id: int,
    bank_ids: Optional[List[int]] = None,
    user_role: Optional[str] = None,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generates a multi-bank comparative evaluation matrix across partner banks for a specific loan application.
    Evaluates interest rates (ROI), maximum eligible loan amount, monthly EMI, total interest payable,
    processing fees, insurance requirements, and internal DSA payout commissions.
    """
    logger.info(f"🔹 [compare_bank_offers] Request for Application #{application_id} | Specific BankIds: {bank_ids}")

    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("compare_bank_offers", user)

    with get_db_session() as db:
        logger.debug(f"🔍 [compare_bank_offers] Querying LoanApplication #{application_id}")
        app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
        if not app:
            logger.error(f"❌ [compare_bank_offers] Loan application #{application_id} not found.")
            raise ValueError(f"Loan application #{application_id} not found.")

        enforce_record_ownership(
            auth_user=user,
            target_customer_id=app.uniqueCustomerId,
            target_agent_id=app.agentId,
            target_app=app,
        )

        selected_bank_ids = bank_ids or []
        if not selected_bank_ids:
            logger.debug(f"🔍 [compare_bank_offers] Discovering partner banks offering Product #{app.productId}...")
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

        role = user_role or user.get("role", "customer")
        logger.info(f"🏦 [compare_bank_offers] Evaluating {len(selected_bank_ids)} banks: {selected_bank_ids} for Role='{role}'")

        raw_result = compare_banks_for_application(
            db=db,
            application_id=application_id,
            bank_ids=selected_bank_ids,
            user_role=role,
        )

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
                comm_amt = b.get("commissionAmount")
                bank_entry["dsaCommissionPct"] = comm_pct
                bank_entry["dsaCommissionPayoutAmt"] = comm_amt

            compact_banks.append(bank_entry)
            logger.debug(f"   🏦 Bank: [{bank_entry['bankName']}] Status: {bank_entry['status']} | ROI: {bank_entry['interestRatePct']}% | EMI: ₹{bank_entry['monthlyEmi']}")

        logger.info(f"✅ [compare_bank_offers] Comparison complete: {len(compact_banks)} banks evaluated.")
        return {
            "applicationId": raw_result.get("applicationId"),
            "customerName": raw_result.get("customerName"),
            "productName": raw_result.get("productName"),
            "requestedAmount": raw_result.get("requestedAmount"),
            "cibilScore": raw_result.get("cibilScore"),
            "totalBanksEvaluated": len(compact_banks),
            "banks": compact_banks,
        }
