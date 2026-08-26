"""
Bank Comparison Orchestration Engine
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.bank import Bank
from app.models.loan_application import LoanApplication
from app.services.eligibility.engine import check_applicant_completeness
from app.ai.services.bank_comparison_ai_service import generate_comparative_ai_analysis
from .bank_evaluator import evaluate_single_bank_offer


def compare_banks_for_application(
    db: Session,
    application_id: int,
    bank_ids: List[int],
    user_role: str = "customer",
) -> Dict[str, Any]:
    """
    Main orchestration handler for Bank Comparison.
    Evaluates underwriting rules for the given bank IDs + generates comparative AI synthesis.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Loan Application #{application_id} not found.")

    # Check if applicant profile and product details are complete
    is_complete, missing_fields, prod_type = check_applicant_completeness(app)
    cgd = app.clientGeneralDetail
    customer_name = (cgd.name if cgd and cgd.name else app.name) or "Applicant"
    prod_name = app.product.name if app.product else ("Home Loan" if prod_type == "home_loan" else "Loan")

    if not is_complete:
        missing_text = ", ".join(missing_fields)
        return {
            "applicationId": app.id,
            "uniqueCustomerId": app.uniqueCustomerId,
            "customerName": customer_name,
            "productName": prod_name,
            "productType": prod_type,
            "status": "INCOMPLETE_DETAILS",
            "missingFields": missing_fields,
            "requestedAmount": float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 0.0),
            "cibilScore": cgd.cibil_score if cgd else None,
            "monthlyIncome": float(cgd.monthly_income) if cgd and cgd.monthly_income else 0.0,
            "banks": [],
            "aiComparativeAnalysis": f"Application profile is incomplete. Please complete: {missing_text} to compare bank policies.",
            "disclaimer": "Please complete applicant profile and financial details to evaluate bank policies.",
        }

    req_amt = float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 5000000.0)

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
        user_role=user_role,
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

