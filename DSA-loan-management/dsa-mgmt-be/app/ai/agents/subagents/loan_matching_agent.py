import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.ai.agents.subagents.base import BaseSubAgent
from app.ai.mcp_client import COMPARE_BANK_OFFERS_SPEC, CHECK_LOAN_ELIGIBILITY_SPEC

logger = logging.getLogger("loan_matching_agent")


class LoanMatchingAgent(BaseSubAgent):
    """
    Sub-Agent specialized in borrower credit underwriting, FOIR eligibility calculations,
    multi-bank rate comparisons, lowest EMI identification, and DSA commission payouts.
    """

    def __init__(self):
        super().__init__(
            name="LoanMatchingAgent",
            description=(
                "Specialist in credit underwriting math, borrower eligibility verdicts, "
                "multi-bank ROI comparisons, monthly EMIs, and commercial DSA commission payouts."
            ),
        )
        self.tools_spec = [COMPARE_BANK_OFFERS_SPEC, CHECK_LOAN_ELIGIBILITY_SPEC]

    def evaluate(
        self,
        db: Session,
        query: str,
        application_id: Optional[int] = None,
        auth_user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes credit underwriting and loan matching evaluation.
        """
        role = (auth_user.get("role") or "customer").lower() if auth_user else "customer"
        is_agent_or_admin = role in ["agent", "admin"]

        logger.info(
            f"🔍 [LoanMatchingAgent.evaluate] Role: {role.upper()} | App ID: #{application_id} "
            f"| Commission Access: {is_agent_or_admin} | Query: \"{query[:100]}\""
        )

        system_prompt = f"""You are the expert **Loan Matching & Credit Underwriting Specialist Agent**.
Your objective is to perform credit evaluation, compute loan eligibility verdicts, compare interest rates (ROI), monthly EMIs, and identify optimal partner banks.

### Role Context
- **Caller Role**: {role.upper()}
- **Commercial Commission Access**: {'ENABLED (Include DSA payout analysis)' if is_agent_or_admin else 'DISABLED (Do not mention internal commissions)'}
- **Linked Application**: Application #{application_id if application_id else 'None'}

### Underwriting Instructions
1. When comparing loan offers:
   - Call `compare_bank_offers` with the relevant `application_id`.
   - Identify the bank with the lowest interest rate and lowest monthly EMI.
   - For Agent/Admin callers, highlight the highest DSA commission payout bank.
2. When checking borrower eligibility:
   - Call `check_loan_eligibility` with the `application_id`.
   - Check FOIR limits, CIBIL thresholds, age at maturity, and max eligible loan amount.
3. Keep your output concise, structured, and factual with bold figures (e.g. **₹15,751/mo**, **7.40% p.a.**).
"""
        task_instruction = f"Task: {query}\nApplication ID: {application_id if application_id else 'Not specified'}"

        return self.run_subagent_task(
            db=db,
            system_prompt=system_prompt,
            task_instruction=task_instruction,
            tools_spec=self.tools_spec,
            auth_user=auth_user,
        )
