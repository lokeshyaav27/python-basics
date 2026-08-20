import json
import logging
from typing import Dict, Any, List
from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.bank_comparison_prompt import build_bank_comparison_prompt

logger = logging.getLogger("bank_comparison_ai_service")


def _build_deterministic_comparison(valid_banks: List[Dict[str, Any]]) -> str:
    """
    Fallback deterministic comparative summary when LLM inference is offline.
    """
    if len(valid_banks) == 2:
        b1, b2 = valid_banks[0], valid_banks[1]
        roi1, roi2 = b1.get("roi") or 0.0, b2.get("roi") or 0.0
        emi1, emi2 = b1.get("emi") or 0.0, b2.get("emi") or 0.0

        diff_emi = abs(emi1 - emi2)
        cheaper_bank = b1["bankName"] if emi1 < emi2 else b2["bankName"]
        higher_bank = b2["bankName"] if emi1 < emi2 else b1["bankName"]

        lines = [
            f"• **Rate & EMI Difference**: **{b1['bankName']}** offers **{roi1}%** (EMI ₹{emi1:,.0f}/mo) vs **{b2['bankName']}** at **{roi2}%** (EMI ₹{emi2:,.0f}/mo).",
            f"• **Monthly Savings**: Choosing **{cheaper_bank}** saves approximately **₹{diff_emi:,.0f}/month** compared to **{higher_bank}**.",
            f"• **Processing & Insurance**: Property insurance (0.10%) and Applicant insurance (0.50%) apply uniformly across standard guidelines.",
            f"• **Recommendation**: **{cheaper_bank}** is the more economical financing partner for this loan requirement based on verified policy guidelines.",
        ]
        return "\n".join(lines)
    elif len(valid_banks) == 1:
        b = valid_banks[0]
        return (
            f"• **Offer Summary**: **{b['bankName']}** offers an interest rate of **{b.get('roi')}% p.a.** "
            f"with a proposed monthly installment of **₹{b.get('emi', 0):,.0f}/mo** for {b.get('tenure')}.\n"
            f"• **Status**: Evaluated as **{b.get('status')}** under verified bank underwriting rules."
        )
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
        return _build_deterministic_comparison(valid_banks)

    bank_summaries = []
    for b in valid_banks:
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
            "commission_payout": b.get("payoutPct") if user_role.lower() in ["agent", "admin"] else None,
        })

    comparison_payload = {
        "customerName": customer_name,
        "productName": product_name,
        "requestedAmount": requested_amount,
        "banks": bank_summaries,
    }

    prompt = build_bank_comparison_prompt(comparison_payload, user_role=user_role)

    try:
        completion = client.chat.completions.create(
            model=ai_config.primary_model,
            messages=[
                {"role": "system", "content": "You are a professional retail banking comparison analyst. Return clean, concise markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=ai_config.temperature,
            max_tokens=600,
        )
        if completion.choices and completion.choices[0].message.content:
            return completion.choices[0].message.content.strip()
        return _build_deterministic_comparison(valid_banks)

    except Exception as err:
        logger.warning(f"AI comparison generation failed: {err}")
        return _build_deterministic_comparison(valid_banks)
