import logging
from typing import Dict, Any
from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.eligibility_explanation_prompt import build_eligibility_explanation_prompt

logger = logging.getLogger("ai_explainer")


def _build_deterministic_explanation(data: Dict[str, Any]) -> str:
    cust = data.get("customerName", "Applicant")
    prod = data.get("productName", "Loan")
    status = data.get("status", "NOT_ELIGIBLE").replace("_", " ")
    req_amt = float(data.get("requestedAmount") or 0.0)
    el_amt = float(data.get("eligibleAmount") or 0.0)
    cibil = data.get("cibilScore") or "—"
    foir = float(data.get("foirPct") or 0.0)
    roi = float(data.get("interestRatePct") or 0.0)
    tenure = data.get("tenureYears") or 0
    emi = float(data.get("proposedEmi") or 0.0)
    income = float(data.get("monthlyIncome") or 0.0)
    ltv = float(data.get("ltvPct") or 0.0)
    max_ltv = float(data.get("maxAllowedLtvPct") or 80.0)

    is_home = "home" in prod.lower()
    is_car = "car" in prod.lower()

    if is_home:
        table = f"""| Metric | Value | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **CIBIL Score** | {cibil} | Min 700 | {'✓ Passed' if isinstance(cibil, int) and cibil >= 700 else '✕ Low'} |
| **FOIR (Debt-to-Income)** | {foir:.1f}% | Max 65.0% | {'✓ Safe' if foir <= 50 else ('⚠️ Reduced' if foir <= 65 else '✕ Breached')} |
| **Collateral LTV** | {ltv:.1f}% | Max {max_ltv:.0f}% | {'✓ Within Limit' if ltv <= max_ltv else '✕ Exceeded'} |
| **Applicable ROI** | {roi:.2f}% p.a. | Risk Tier Base | ✓ |
| **Loan Tenure** | {tenure} Yrs | Max 30 Yrs (Age ≤ 60) | ✓ |
| **Proposed EMI** | ₹{emi:,.0f}/mo | Monthly Income: ₹{income:,.0f}/mo | {'✓ Serviceable' if el_amt > 0 else '✕ Ineligible'} |"""
    elif is_car:
        table = f"""| Metric | Value | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **CIBIL Score** | {cibil} | Min 700 | {'✓ Passed' if isinstance(cibil, int) and cibil >= 700 else '✕ Low'} |
| **FOIR (Debt-to-Income)** | {foir:.1f}% | Max 65.0% | {'✓ Safe' if foir <= 50 else ('⚠️ Reduced' if foir <= 65 else '✕ Breached')} |
| **Vehicle Funding (LTV)** | {ltv:.1f}% | Max {max_ltv:.0f}% (On-Road) | {'✓ Within Limit' if ltv <= max_ltv else '✕ Exceeded'} |
| **Applicable ROI** | {roi:.2f}% p.a. | Tier-based | ✓ |
| **Loan Tenure** | {tenure} Yrs | Max 5–7 Yrs | ✓ |
| **Proposed EMI** | ₹{emi:,.0f}/mo | Monthly Income: ₹{income:,.0f}/mo | {'✓ Serviceable' if el_amt > 0 else '✕ Ineligible'} |"""
    else:
        table = f"""| Metric | Value | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **CIBIL Score** | {cibil} | Min 700 | {'✓ Passed' if isinstance(cibil, int) and cibil >= 700 else '✕ Low'} |
| **FOIR (Debt-to-Income)** | {foir:.1f}% | Max 50.0% | {'✓ Safe' if foir <= 50 else '✕ Breached'} |
| **Net Monthly Income** | ₹{income:,.0f}/mo | Min ₹25,000/mo | {'✓ Passed' if income >= 25000 else '✕ Insufficient'} |
| **Applicable ROI** | {roi:.2f}% p.a. | Unsecured Tier | ✓ |
| **Loan Tenure** | {tenure} Yrs | Max 5 Yrs | ✓ |
| **Proposed EMI** | ₹{emi:,.0f}/mo | Monthly Income: ₹{income:,.0f}/mo | {'✓ Serviceable' if el_amt > 0 else '✕ Ineligible'} |"""

    analysis = data.get("positiveFactors", ["Application evaluated against policy benchmarks."])[0]
    next_step = (
        "Proceed to partner bank offer comparison to secure pre-approval."
        if el_amt >= req_amt
        else "Consider reducing loan amount or extending tenure to improve eligibility ratios."
    )

    return f"""**Loan Eligibility Summary – {cust} ({prod})**

- **Outcome:** **{status.title()}** — {'Full loan approved for ₹' + f'{el_amt:,.0f}' if el_amt >= req_amt else ('Approved for adjusted loan limit of ₹' + f'{el_amt:,.0f} (requested ₹{req_amt:,.0f})' if el_amt > 0 else 'Request of ₹' + f'{req_amt:,.0f} cannot be approved under current underwriting thresholds.')}.

### Key Assessment Metrics
{table}

- **Underwriting Analysis:** {analysis}
- **Actionable Next Steps:** {next_step}"""


def generate_ai_explanation(eligibility_data: Dict[str, Any]) -> str:
    """
    Generates a natural language summary and underwriting guidance using Groq's
    configured model with fallback to deterministic rule summary.
    """
    status = eligibility_data.get("status")
    if status == "INCOMPLETE_DETAILS":
        missing = ", ".join(eligibility_data.get("missingFields", []))
        return f"Application profile is currently incomplete. Please provide: {missing} to compute eligibility."

    if status == "ERROR":
        return eligibility_data.get("message", "Unable to evaluate application.")

    client = get_groq_client()
    if not client:
        return _build_deterministic_explanation(eligibility_data)

    prompt = build_eligibility_explanation_prompt(eligibility_data)
    try:
        completion = client.chat.completions.create(
            model=ai_config.primary_model,
            messages=[
                {"role": "system", "content": "You are a professional retail loan credit underwriter in India."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=1500,
        )
        return completion.choices[0].message.content or _build_deterministic_explanation(eligibility_data)
    except Exception as e:
        logger.warning(f"AI explanation generation failed: {e}")
        return _build_deterministic_explanation(eligibility_data)
