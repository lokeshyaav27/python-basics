import json
from typing import Dict, Any


def build_eligibility_explanation_prompt(
    eligibility_data: Dict[str, Any], user_role: str = "customer"
) -> str:
    """
    Builds the LLM prompt for generating natural language loan underwriting explanations
    with dynamic persona and recommendations tailored for customer vs agent/admin.
    """
    prod_type = str(eligibility_data.get("productType") or eligibility_data.get("productName") or "").lower()
    customer_name = eligibility_data.get("customerName", "Applicant")
    product_name = eligibility_data.get("productName", "Loan")
    is_agent_or_admin = user_role.lower() in ["agent", "admin"]

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

    if is_agent_or_admin:
        persona_header = "You are a senior DSA Credit Underwriting & Lead Optimization Specialist in Indian retail lending."
        role_instructions = """
PERSPECTIVE RULES FOR AGENT/ADMIN:
- Target Audience: The Loan Agent / Underwriting Manager handling this application.
- Goal: Help the agent structure the file to secure highest approved loan amount, resolve ratio bottlenecks, and convert the lead.
- In 'Underwriting Analysis': Explain policy mechanics (e.g. why FOIR or LTV breached) and credit mitigants.
- In 'Actionable Next Steps': Give the agent concrete operational actions (e.g. collect additional co-borrower income, adjust tenure, or pitch specific partner banks with flexible FOIR tiers).
"""
    else:
        persona_header = "You are a supportive, transparent Personal Loan & Credit Advisory Expert in India."
        role_instructions = """
PERSPECTIVE RULES FOR CUSTOMER:
- Target Audience: The Loan Applicant (Borrower).
- Goal: Explain the eligibility decision in clear, empathetic, and jargon-free language.
- In 'Underwriting Analysis': Explain how monthly income, existing debts, and property value determine loan safety.
- In 'Actionable Next Steps': Provide encouraging, practical steps for the applicant (e.g. adding a family co-applicant or clearing a small existing EMI to lower monthly obligations).
"""

    return f"""{persona_header}
Analyze the following loan evaluation data and output the explanation in the EXACT template below:

Eligibility Assessment Data:
{json.dumps(eligibility_data, indent=2, default=str)}

User Role: {user_role.upper()}
{role_instructions}

MANDATORY OUTPUT FORMAT:
**Loan Eligibility Summary – {customer_name} ({product_name})**

- **Outcome:** **[Eligible / Partially Eligible / Not Eligible]** — [1-sentence concise decision summary with eligible amount vs requested amount].

### Key Assessment Metrics
{table_example}

- **Underwriting Analysis:** [2-3 sentences explaining why the loan qualified, was adjusted, or was rejected based on the data above].
- **Actionable Next Steps:** [1-2 practical, specific recommendations for the {'agent' if is_agent_or_admin else 'applicant'} to proceed].

STRICT RULES:
1. Replace all placeholders in the table with actual values from the evaluation data.
2. In the table Status column, use ✓ for passed, ⚠️ for reduced/conditional, and ✕ for breached.
3. Keep the tone professional, objective, and clear. Do NOT add greetings or conversational filler.
"""


# Backward-compatible alias
build_underwriting_prompt = build_eligibility_explanation_prompt
