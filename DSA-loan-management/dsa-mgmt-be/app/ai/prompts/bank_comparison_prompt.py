import json
from typing import Dict, Any


def build_bank_comparison_prompt(comparison_data: Dict[str, Any], user_role: str = "customer") -> str:
    """
    Builds user prompt for generating multi-bank comparative loan analysis and recommendations
    with a mandatory tabular format for Key Comparative Metrics.
    """
    customer_name = comparison_data.get("customerName", "Applicant")
    product_name = comparison_data.get("productName", "Loan")
    banks = comparison_data.get("banks", [])
    is_agent_or_admin = user_role.lower() in ["agent", "admin"]

    if len(banks) >= 2:
        bank1_name = banks[0].get("bank_name", "Bank 1")
        bank2_name = banks[1].get("bank_name", "Bank 2")
        has_comm = is_agent_or_admin and any(b.get("dsa_commission") for b in banks)
        commission_row = f"\n| **DSA Payout Commission** | {{comm1}} | {{comm2}} | {{e.g. {bank1_name} yields higher payout}} |" if has_comm else ""
        table_example = f"""| Parameter | {bank1_name} | {bank2_name} | Key Advantage / Assessment |
| :--- | :--- | :--- | :--- |
| **Approval Status** | {{status1}} | {{status2}} | {{Assessment}} |
| **Interest Rate (ROI)** | {{roi1}} | {{roi2}} | {{e.g. {bank1_name} is lower}} |
| **Monthly EMI** | {{emi1}} | {{emi2}} | {{e.g. {bank1_name} saves ₹/mo}} |
| **Eligible Loan Amount** | {{amt1}} | {{amt2}} | {{Assessment}} |
| **Processing Fee** | {{fee1}} | {{fee2}} | {{Assessment}} |
| **Female Co-applicant Benefit** | {{female1}} | {{female2}} | {{Assessment}} |{commission_row}""".strip()
    else:
        bank_name = banks[0].get("bank_name", "Bank") if banks else "Bank"
        has_comm = is_agent_or_admin and any(b.get("dsa_commission") for b in banks)
        commission_row = f"\n| **DSA Payout Commission** | {{comm}} | Standard Margin | ✓ |" if has_comm else ""
        table_example = f"""| Parameter | {bank_name} | Policy Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **Approval Status** | {{status}} | Policy Benchmark | ✓ / ⚠️ / ✕ |
| **Interest Rate (ROI)** | {{roi}} | Standard Tier | ✓ |
| **Monthly EMI** | {{emi}} | Debt-service limit | ✓ |
| **Eligible Loan Amount** | {{amt}} | Requested limit | ✓ |
| **Processing Fee** | {{fee}} | Upfront Charge | ✓ |{commission_row}""".strip()

    if is_agent_or_admin:
        persona_header = "You are a senior DSA Commercial & Loan Underwriting Strategist in India."
        role_perspective_instructions = """
PERSPECTIVE RULES FOR AGENT/ADMIN:
- Target Audience: The Loan Agent / DSA Partner.
- Commercial Principle: Higher DSA commission percentage and payout amount is MORE FAVOURABLE for the agent / DSA business.
- In 'Recommendation': Recommend the bank that delivers the highest DSA commission payout while ensuring loan eligibility, or highlight the commercial advantage for the agent.
- In 'Comparative Analysis': Explicitly contrast customer affordability (monthly EMI) vs agent revenue (commission payout difference in ₹).
- In 'Actionable Next Steps': Provide tactical sales positioning advice for the agent to convert the lead on the preferred bank.
"""
        recommendation_placeholder = "[Recommended Bank Name] is recommended for the agent — [1-sentence rationale highlighting higher DSA commission payout (+₹ amount) alongside competitive loan terms for the borrower]."
        next_steps_placeholder = "[1-2 practical, concrete sales/operational recommendations for the agent to close the deal]."
    else:
        persona_header = "You are an independent, transparent Retail Banking & Loan Comparison Advisor in India."
        role_perspective_instructions = """
PERSPECTIVE RULES FOR CUSTOMER:
- Target Audience: The Loan Applicant (Borrower).
- Consumer Principle: Lowest interest rate (ROI) and lowest monthly EMI is MORE FAVOURABLE for the customer.
- In 'Recommendation': Recommend the bank with the lowest monthly EMI and lowest total cost of borrowing.
- In 'Comparative Analysis': Highlight monthly EMI savings and fee transparency.
- Strictly do NOT mention or reveal internal DSA commission payouts.
- In 'Actionable Next Steps': Provide straightforward steps for the applicant to apply and complete KYC.
"""
        recommendation_placeholder = "[Recommended Bank Name] is the optimal choice — [1-sentence concise rationale highlighting lowest EMI, lowest interest rate, and total cost savings]."
        next_steps_placeholder = "[1-2 practical, concrete recommendations for the applicant to proceed with the application]."

    return f"""{persona_header}
Analyze the following multi-bank loan comparison data and output the synthesis in the EXACT template below:

Comparison Data:
{json.dumps(comparison_data, indent=2, default=str)}

User Role: {user_role.upper()}
{role_perspective_instructions}

MANDATORY OUTPUT FORMAT:
**Bank Comparison Summary – {customer_name} ({product_name})**

- **Recommendation:** {recommendation_placeholder}

### Key Comparative Metrics
{table_example}

- **Comparative Analysis:** [2-3 sentences explaining the core trade-offs between rates, EMI savings, processing fees, and document requirements].
- **Actionable Next Steps:** {next_steps_placeholder}

STRICT RULES:
1. Replace all table placeholders with actual values from the Comparison Data.
2. In the table Key Advantage column, clearly specify which bank wins or why.
3. Keep the tone professional, concise, and structured. Do NOT add greetings or conversational filler.
"""


# Backward-compatible alias
build_comparison_prompt = build_bank_comparison_prompt


