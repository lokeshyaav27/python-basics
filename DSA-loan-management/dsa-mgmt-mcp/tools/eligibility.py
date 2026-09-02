import logging
from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac, enforce_record_ownership
from dsa_common.models import LoanApplication
from dsa_common.services.eligibility import evaluate_loan_application

logger = logging.getLogger("mcp_tools.eligibility")


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
    logger.info(f"🔹 [check_loan_eligibility] Processing request for Application #{application_id}")

    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("check_loan_eligibility", user)

    with get_db_session() as db:
        logger.debug(f"🔍 [check_loan_eligibility] Querying database for LoanApplication #{application_id}")
        app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
        if not app:
            logger.error(f"❌ [check_loan_eligibility] Loan application #{application_id} not found in database.")
            raise ValueError(f"Loan application #{application_id} not found.")

        logger.info(f"📋 [check_loan_eligibility] Found App #{app.id} | Customer: '{app.name}' ({app.uniqueCustomerId}) | Status: '{app.status}'")

        enforce_record_ownership(
            auth_user=user,
            target_customer_id=app.uniqueCustomerId,
            target_agent_id=app.agentId,
            target_app=app,
        )

        logger.info(f"🧮 [check_loan_eligibility] Executing underwriting math engine for App #{application_id}...")
        result = evaluate_loan_application(db=db, application_id=application_id)
        
        status = result.get("status") or result.get("overallStatus") or "COMPLETED"
        max_amount = result.get("maxEligibleAmount") or result.get("eligibleLoanAmount")
        foir = result.get("foir") or result.get("calculatedFoir")
        
        logger.info(f"✅ [check_loan_eligibility] Underwriting Complete | Status: {status} | Max Loan: ₹{max_amount} | FOIR: {foir}%")
        return result
