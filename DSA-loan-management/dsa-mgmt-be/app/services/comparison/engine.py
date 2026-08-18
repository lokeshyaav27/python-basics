"""
Bank Comparison Orchestration Engine & AI Comparative Analyzer
"""
import os
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.bank import Bank
from app.models.loan_application import LoanApplication
from app.core.config import settings
from .bank_evaluator import evaluate_single_bank_offer


def generate_comparative_ai_analysis(
    customer_name: str,
    product_name: str,
    requested_amount: float,
    banks_data: List[Dict[str, Any]],
) -> str:
    """
    Generates side-by-side comparative analysis using Groq's openai/gpt-oss-120b
    (or falls back to a structured rule-based comparative summary).
    """
    valid_banks = [b for b in banks_data if b.get("isLinked") and b.get("status") != "N/A"]
    if not valid_banks:
        return "Selected banks do not offer the requested loan product or policy information is unavailable."

    groq_api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")

    if groq_api_key and len(valid_banks) >= 1:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)

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
                })

            prompt_content = f"""
You are a senior DSA Banking & Loan Underwriter.
Compare the following bank offers for applicant {customer_name} requesting ₹{requested_amount:,.0f} {product_name}:

Banks to Compare:
{json.dumps(bank_summaries, indent=2)}

Provide a concise, professional comparison in markdown:
1. **Interest Rate & EMI Comparison**: Compare monthly EMI and interest savings between the banks.
2. **Fees, Insurance & Tenure**: Highlight differences in processing fees, tenure caps, or female concessions.
3. **Recommended Choice**: Give a clear recommendation on which bank offers the best terms and lowest overall cost of borrowing for this applicant.
Keep the response to 3-4 bullet points.
"""

            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a professional banking comparison analyst. Return clean, concise markdown."},
                    {"role": "user", "content": prompt_content},
                ],
                model=settings.GROQ_MODEL or "openai/gpt-oss-120b",
                temperature=0.2,
                max_tokens=450,
            )

            if chat_completion.choices and chat_completion.choices[0].message.content:
                return chat_completion.choices[0].message.content.strip()

        except Exception as err:
            print(f"Groq Comparative Analysis note: {err}")

    # ── Fallback Deterministic Comparative Summary ────────────────────────────
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
            f"• **Processing & Insurance**: Property insurance (0.10%) and Applicant insurance (0.50%) apply uniformly across standard RAG guidelines.",
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


def compare_banks_for_application(
    db: Session,
    application_id: int,
    bank_ids: List[int],
    user_role: str = "customer",
) -> Dict[str, Any]:
    """
    Main orchestration handler for Bank Comparison.
    Enforces maximum 2 banks constraint.
    """
    if len(bank_ids) > 2:
        raise HTTPException(status_code=400, detail="You cannot compare more than 2 banks at once.")

    if len(bank_ids) == 0:
        raise HTTPException(status_code=400, detail="Please select at least 1 bank to evaluate.")

    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Loan Application #{application_id} not found.")

    cgd = app.clientGeneralDetail
    req_amt = float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 5000000.0)
    customer_name = (cgd.name if cgd and cgd.name else app.name) or "Applicant"
    prod_name = app.product.name if app.product else "Home Loan"

    # Evaluate each selected bank
    compared_banks: List[Dict[str, Any]] = []
    for bid in bank_ids:
        bank = db.query(Bank).filter(Bank.id == bid).first()
        if not bank:
            continue
        
        bank_result = evaluate_single_bank_offer(
            db=db,
            bank=bank,
            application=app,
            user_role=user_role,
        )
        compared_banks.append(bank_result)

    # Generate comparative AI analysis
    ai_analysis = generate_comparative_ai_analysis(
        customer_name=customer_name,
        product_name=prod_name,
        requested_amount=req_amt,
        banks_data=compared_banks,
    )

    return {
        "applicationId": app.id,
        "uniqueCustomerId": app.uniqueCustomerId,
        "customerName": customer_name,
        "productName": prod_name,
        "productType": prod_name,
        "requestedAmount": req_amt,
        "cibilScore": cgd.cibil_score if cgd else None,
        "monthlyIncome": float(cgd.monthly_income) if cgd and cgd.monthly_income else 0.0,
        "banks": compared_banks,
        "aiComparativeAnalysis": ai_analysis,
        "disclaimer": (
            "Comparison data is evaluated against bank policy guidelines and current loan parameters. "
            "Terms are subject to bank credit approval and document verification."
        ),
    }
