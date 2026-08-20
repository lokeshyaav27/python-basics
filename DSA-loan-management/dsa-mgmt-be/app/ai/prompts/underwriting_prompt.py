import json
from typing import Dict, Any


def build_underwriting_prompt(eligibility_data: Dict[str, Any]) -> str:
    """
    Builds user prompt for generating natural language loan underwriting explanations
    with a mandatory tabular format for Key Assessment Metrics tailored by loan type.
    """
    prod_type = str(eligibility_data.get("productType") or eligibility_data.get("productName") or "").lower()
    customer_name = eligibility_data.get("customerName", "Applicant")
    product_name = eligibility_data.get("productName", "Loan")

    if "home" in prod_type:
        table_example = """| Metric | Value | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **CIBIL Score** | {cibil} | Min 700 | ✓ / ✕ |
| **FOIR (Debt-to-Income)** | {foir}% | Max 65.0% | ✓ / ⚠️ / ✕ |
| **Collateral LTV** | {ltv}% | Max {maxLtv}% | ✓ / ✕ |
| **Applicable ROI** | {roi}% p.a. | Risk Tier Base | ✓ |
| **Loan Tenure** | {tenure} Yrs | Max 30 Yrs (Age ≤ 60) | ✓ / ✕ |
| **Proposed EMI** | ₹{emi}/mo | Monthly Income: ₹{income}/mo | ✓ / ⚠️ |"""
    elif "car" in prod_type:
        table_example = """| Metric | Value | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **CIBIL Score** | {cibil} | Min 700 | ✓ / ✕ |
| **FOIR (Debt-to-Income)** | {foir}% | Max 65.0% | ✓ / ⚠️ / ✕ |
| **Vehicle Funding (LTV)** | {ltv}% | Max {maxLtv}% (On-Road) | ✓ / ✕ |
| **Applicable ROI** | {roi}% p.a. | Tier-based | ✓ |
| **Loan Tenure** | {tenure} Yrs | Max 5–7 Yrs | ✓ |
| **Proposed EMI** | ₹{emi}/mo | Monthly Income: ₹{income}/mo | ✓ / ⚠️ |"""
    else:
        table_example = """| Metric | Value | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **CIBIL Score** | {cibil} | Min 700 | ✓ / ✕ |
| **FOIR (Debt-to-Income)** | {foir}% | Max 50.0% | ✓ / ⚠️ / ✕ |
| **Net Monthly Income** | ₹{income}/mo | Min ₹25,000/mo | ✓ / ✕ |
| **Applicable ROI** | {roi}% p.a. | Unsecured Tier | ✓ |
| **Loan Tenure** | {tenure} Yrs | Max 5 Yrs | ✓ |
| **Proposed EMI** | ₹{emi}/mo | Monthly Income: ₹{income}/mo | ✓ / ⚠️ |"""

    return f"""You are a senior credit underwriting expert in Indian retail lending.
Analyze the following loan evaluation data and output the explanation in the EXACT template below:

Eligibility Assessment Data:
{json.dumps(eligibility_data, indent=2, default=str)}

MANDATORY OUTPUT FORMAT:
**Loan Eligibility Summary – {customer_name} ({product_name})**

- **Outcome:** **[Eligible / Partially Eligible / Not Eligible]** — [1-sentence concise decision summary with eligible amount vs requested amount].

### Key Assessment Metrics
{table_example}

- **Underwriting Analysis:** [2-3 sentences explaining why the loan qualified, was adjusted, or was rejected based on the data above].
- **Actionable Next Steps:** [1-2 practical, specific recommendations for the applicant or DSA agent].

STRICT RULES:
1. Replace all placeholders in the table with actual values from the evaluation data.
2. In the table Status column, use ✓ for passed, ⚠️ for reduced/conditional, and ✕ for breached.
3. Keep the tone professional, objective, and clear. Do NOT add greetings or conversational filler.
"""

