import json
import logging
from typing import Dict, Any, List
from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.bank_comparison_prompt import build_bank_comparison_prompt

logger = logging.getLogger("bank_comparison_ai_service")


def _build_deterministic_comparison(
    customer_name: str,
    product_name: str,
    requested_amount: float,
    valid_banks: List[Dict[str, Any]],
    user_role: str = "customer",
) -> str:
    """
    Fallback deterministic comparative summary when LLM inference is offline.
    """
    is_agent_or_admin = user_role.lower() in ["agent", "admin"]

    if len(valid_banks) >= 2:
        b1, b2 = valid_banks[0], valid_banks[1]
        name1, name2 = b1.get("bankName", "Bank 1"), b2.get("bankName", "Bank 2")
        roi1, roi2 = b1.get("roi") or 0.0, b2.get("roi") or 0.0
        emi1, emi2 = b1.get("emi") or 0.0, b2.get("emi") or 0.0
        amt1, amt2 = b1.get("loanAmount") or 0.0, b2.get("loanAmount") or 0.0
        fee1, fee2 = b1.get("processingFee") or "Standard", b2.get("processingFee") or "Standard"
        fem1, fem2 = b1.get("benefitForFemaleCoApplicant") or "None", b2.get("benefitForFemaleCoApplicant") or "None"
        status1, status2 = b1.get("status") or "ELIGIBLE", b2.get("status") or "ELIGIBLE"

        diff_emi = abs(emi1 - emi2)
        cheaper_bank = name1 if emi1 < emi2 else name2
        higher_bank = name2 if emi1 < emi2 else name1

        roi_adv = f"{name1} is {abs(roi1 - roi2):.2f}% lower" if roi1 != roi2 else "Identical rates"
        emi_adv = f"{cheaper_bank} saves ₹{diff_emi:,.0f}/mo" if diff_emi > 0 else "Equal monthly installments"

        comm_row = ""
        if is_agent_or_admin:
            c1 = b1.get("dsaCommission") or (f"{b1.get('commissionPct')}%" if b1.get('commissionPct') is not None else "1.0%")
            c2 = b2.get("dsaCommission") or (f"{b2.get('commissionPct')}%" if b2.get('commissionPct') is not None else "1.0%")
            p1 = float(b1.get("commissionPct") or 0.0)
            p2 = float(b2.get("commissionPct") or 0.0)
            amt_diff = abs((b1.get("commissionAmount") or 0.0) - (b2.get("commissionAmount") or 0.0))
            if p1 > p2:
                comm_adv = f"{name1} yields higher DSA payout (+₹{amt_diff:,.0f})"
            elif p2 > p1:
                comm_adv = f"{name2} yields higher DSA payout (+₹{amt_diff:,.0f})"
            else:
                comm_adv = "Equal DSA commission payout"
            comm_row = f"\n| **DSA Payout Commission** | {c1} | {c2} | {comm_adv} |"

        table = f"""| Parameter | {name1} | {name2} | Key Advantage / Assessment |
| :--- | :--- | :--- | :--- |
| **Approval Status** | {status1.title()} | {status2.title()} | {'✓ Both Eligible' if status1 == 'ELIGIBLE' and status2 == 'ELIGIBLE' else 'Review Criteria'} |
| **Interest Rate (ROI)** | {roi1}% p.a. | {roi2}% p.a. | {roi_adv} |
| **Monthly EMI** | ₹{emi1:,.0f}/mo | ₹{emi2:,.0f}/mo | {emi_adv} |
| **Eligible Loan Amount** | ₹{amt1:,.0f} | ₹{amt2:,.0f} | {'Full Amount' if amt1 >= requested_amount and amt2 >= requested_amount else 'Partial'} |
| **Processing Fee** | {fee1} | {fee2} | Upfront costs apply |
| **Female Co-applicant Benefit** | {fem1} | {fem2} | Policy concessions |{comm_row}"""

        agent_note = ""
        if is_agent_or_admin:
            agent_note = f" From a DSA commercial standpoint, {name1 if p1 >= p2 else name2} delivers optimal commission revenue."

        return f"""**Bank Comparison Summary – {customer_name} ({product_name})**

- **Recommendation:** **{cheaper_bank}** is the optimal choice for the customer — Offers lower interest ({min(roi1, roi2)}% p.a.) and saves approximately ₹{diff_emi:,.0f}/month compared to {higher_bank}.

### Key Comparative Metrics
{table}

- **Comparative Analysis:** {cheaper_bank} provides more favorable overall debt service terms for the borrower with ₹{diff_emi:,.0f}/mo lower EMI.{agent_note}
- **Actionable Next Steps:** Proceed with the preferred bank to initiate document verification and lock in the applicable ROI tier."""

    elif len(valid_banks) == 1:
        b = valid_banks[0]
        name = b.get("bankName", "Bank")
        roi = b.get("roi") or 0.0
        emi = b.get("emi") or 0.0
        amt = b.get("loanAmount") or 0.0
        fee = b.get("processingFee") or "Standard"
        status = b.get("status") or "ELIGIBLE"

        comm_row = ""
        if is_agent_or_admin:
            c = b.get("dsaCommission") or (f"{b.get('commissionPct')}%" if b.get('commissionPct') is not None else "1.0%")
            comm_row = f"\n| **DSA Payout Commission** | {c} | Standard Margin | ✓ |"

        table = f"""| Parameter | {name} | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **Approval Status** | {status.title()} | Policy Benchmark | ✓ Passed |
| **Interest Rate (ROI)** | {roi}% p.a. | Standard Tier | ✓ |
| **Monthly EMI** | ₹{emi:,.0f}/mo | Debt-service limit | ✓ Serviceable |
| **Eligible Loan Amount** | ₹{amt:,.0f} | Requested ₹{requested_amount:,.0f} | ✓ Approved |
| **Processing Fee** | {fee} | Upfront Charge | ✓ |{comm_row}"""

        return f"""**Bank Evaluation Summary – {customer_name} ({product_name})**

- **Recommendation:** **{name}** offer evaluated — Pre-approved for ₹{amt:,.0f} at {roi}% p.a.

### Key Comparative Metrics
{table}

- **Comparative Analysis:** {name} fulfills the requested underwriting benchmarks for this applicant profile.
- **Actionable Next Steps:** Complete KYC submission to begin sanction letter processing."""

    return "No comparative data available for the selected banks."


def generate_comparative_ai_analysis(
    customer_name: str,
    product_name: str,
    requested_amount: float,
    banks_data: List[Dict[str, Any]],
    user_role: str = "customer",
) -> str:
    """
    Generates side-by-side comparative analysis using Groq's configured model
    (or falls back to a structured rule-based comparative summary).
    """
    valid_banks = [b for b in banks_data if b.get("isLinked") and b.get("status") != "N/A"]
    if not valid_banks:
        return "Selected banks do not offer the requested loan product or policy information is unavailable."

    client = get_groq_client()
    if not client:
        return _build_deterministic_comparison(
            customer_name, product_name, requested_amount, valid_banks, user_role=user_role
        )

    bank_summaries = []
    for b in valid_banks:
        comm_val = b.get("dsaCommission") or (f"{b.get('commissionPct')}%" if b.get("commissionPct") is not None else None)
        bank_summaries.append({
            "bank_name": b.get("bankName"),
            "status": b.get("status"),
            "roi": f"{b.get('roi')}%",
            "eligible_loan": f"₹{b.get('loanAmount', 0):,.0f}",
            "monthly_emi": f"₹{b.get('emi', 0):,.0f}",
            "tenure": b.get("tenure"),
            "processing_fee": b.get("processingFee"),
            "female_benefit": b.get("benefitForFemaleCoApplicant"),
            "has_policy_docs": b.get("hasPolicyDocs"),
            "rejections": b.get("reasonForRejection"),
            "dsa_commission": comm_val if user_role.lower() in ["agent", "admin"] else None,
        })

    comparison_payload = {
        "customerName": customer_name,
        "productName": product_name,
        "requestedAmount": requested_amount,
        "banks": bank_summaries,
    }

    prompt = build_bank_comparison_prompt(comparison_payload, user_role=user_role)

    for model_name in ai_config.candidate_models:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a professional retail banking comparison analyst. Return clean, concise markdown."},
                    {"role": "user", "content": prompt},
                ],
                temperature=ai_config.temperature,
                max_tokens=1500,
            )
            if completion.choices and completion.choices[0].message.content:
                return completion.choices[0].message.content.strip()
        except Exception as err:
            logger.warning(f"Model '{model_name}' failed for comparison: {err}. Trying next...")

    return _build_deterministic_comparison(
        customer_name, product_name, requested_amount, valid_banks, user_role=user_role
    )

