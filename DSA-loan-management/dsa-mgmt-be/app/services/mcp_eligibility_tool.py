"""
MCP Tool & Groq LLM Integration for Loan Eligibility Assessment
Model: openai/gpt-oss-120b via Groq
"""
import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.eligibility import evaluate_loan_application


# ── MCP Tool Specification ──────────────────────────────────────────────────
MCP_ELIGIBILITY_TOOL_SPEC = {
    "name": "check_loan_eligibility",
    "description": (
        "Evaluates applicant loan eligibility based on DSA underwriting standards, "
        "checking CIBIL score, FOIR debt-to-income ratio, property/vehicle LTV, "
        "age criteria, and product-specific caps for Home, Car, or Personal loans."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the customer loan application.",
            }
        },
        "required": ["application_id"],
    },
}


def execute_mcp_eligibility_tool(db: Session, application_id: int) -> Dict[str, Any]:
    """
    Executes the deterministic Python eligibility engine as an MCP tool.
    """
    return evaluate_loan_application(db=db, application_id=application_id)


def generate_ai_explanation(eligibility_data: Dict[str, Any]) -> str:
    """
    Generates a natural language summary and underwriting guidance using Groq's
    'openai/gpt-oss-120b' model (or falls back to a structured rule summary).
    """
    status = eligibility_data.get("status")
    if status == "INCOMPLETE_DETAILS":
        missing = ", ".join(eligibility_data.get("missingFields", []))
        return f"Application profile is currently incomplete. Please provide: {missing} to compute eligibility."

    if status == "ERROR":
        return eligibility_data.get("message", "Unable to evaluate application.")

    groq_api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")

    # If Groq API Key is available, invoke Groq with configured model (openai/gpt-oss-120b)
    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)

            prompt_content = f"""
You are a senior DSA Loan Underwriting Specialist.
Analyze this loan eligibility calculation for {eligibility_data.get('customerName')} applying for a {eligibility_data.get('productType')}:

- Final Status: {eligibility_data.get('status')}
- Requested Amount: ₹{eligibility_data.get('requestedAmount', 0):,.0f}
- Approved / Eligible Amount: ₹{eligibility_data.get('eligibleAmount', 0):,.0f}
- Proposed Monthly EMI: ₹{eligibility_data.get('proposedEmi', 0):,.0f}
- Applied Interest Rate: {eligibility_data.get('interestRatePct', 0)}% p.a.
- Calculated FOIR (Debt-to-Income): {eligibility_data.get('foirPct', 0):.1f}% (Max permissible: 65%)
- LTV (Loan-to-Value): {eligibility_data.get('ltvPct', 0)}% (Max allowed: {eligibility_data.get('maxAllowedLtvPct', 0)}%)
- CIBIL Credit Score: {eligibility_data.get('cibilScore', 'N/A')}
- Rejections / Warnings: {json.dumps(eligibility_data.get('rejections', []))}
- Reduction Notes: {json.dumps(eligibility_data.get('reductionNotes', []))}
- Positive Factors: {json.dumps(eligibility_data.get('positiveFactors', []))}

Provide a concise, professional 3 to 4 bullet-point summary explaining:
1. The clear outcome (Fully Approved, Reduced/Conditional, or Ineligible).
2. Key debt-servicing and ratio factors (FOIR, CIBIL, or LTV).
3. Next actionable step for the customer / DSA agent.
Keep the tone helpful, clear, and professional.
"""
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert DSA banking underwriter. Return clean, concise markdown."},
                    {"role": "user", "content": prompt_content},
                ],
                model=settings.GROQ_MODEL or "openai/gpt-oss-120b",
                temperature=0.2,
                max_tokens=400,
            )

            if chat_completion.choices and chat_completion.choices[0].message.content:
                return chat_completion.choices[0].message.content.strip()

        except Exception as err:
            # Fall back gracefully to structured rule explanation
            print(f"Groq SDK call note: {err}")

    # ── Fallback Deterministic Rule-Based Explanation ──────────────────────────
    product = eligibility_data.get("productType", "Loan")
    req_amt = eligibility_data.get("requestedAmount", 0)
    el_amt = eligibility_data.get("eligibleAmount", 0)
    foir = eligibility_data.get("foirPct", 0)
    roi = eligibility_data.get("interestRatePct", 0)
    rejections = eligibility_data.get("rejections", [])
    reductions = eligibility_data.get("reductionNotes", [])

    if status == "ELIGIBLE":
        return (
            f"✅ **Fully Eligible:** The applicant qualifies for the full requested amount of **₹{req_amt:,.0f}** "
            f"at an interest rate of **{roi}% p.a.** with a safe FOIR of **{foir:.1f}%**. "
            "Debt-servicing capacity and credit standing meet all underwriting benchmarks."
        )
    elif status == "PARTIALLY_ELIGIBLE":
        red_text = reductions[0] if reductions else "debt-to-income and collateral limits"
        return (
            f"⚠️ **Partially Eligible:** Qualified for **₹{el_amt:,.0f}** (out of requested ₹{req_amt:,.0f}). "
            f"{red_text}. The proposed monthly EMI is ₹{eligibility_data.get('proposedEmi', 0):,.0f} at {roi}% p.a."
        )
    else:
        rej_text = " • ".join(rejections) if rejections else "Criteria not satisfied"
        return (
            f"❌ **Not Eligible:** The application cannot be approved under current parameters. "
            f"Reasons: {rej_text}. Consider adding a co-applicant or clearing existing debt obligations."
        )
