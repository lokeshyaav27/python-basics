"""
Multi-Bank Comparison Orchestration Engine
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from dsa_common.models.bank import Bank
from dsa_common.models.loan_application import LoanApplication
from dsa_common.services.eligibility.engine import check_applicant_completeness
from dsa_common.services.comparison.bank_evaluator import evaluate_single_bank_offer


def compare_banks_for_application(
    db: Session,
    application_id: int,
    bank_ids: List[int],
    user_role: str = "customer",
) -> Dict[str, Any]:
    """
    Main orchestration handler for Bank Comparison.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise ValueError(f"Loan Application #{application_id} not found.")

    is_complete, missing_fields, prod_type = check_applicant_completeness(app)
    cgd = app.clientGeneralDetail
    customer_name = (cgd.name if cgd and cgd.name else app.name) or "Applicant"
    prod_name = app.product.name if app.product else ("Home Loan" if prod_type == "home_loan" else "Loan")

    if not is_complete:
        return {
            "applicationId": app.id,
            "uniqueCustomerId": app.uniqueCustomerId,
            "customerName": customer_name,
            "productName": prod_name,
            "status": "INCOMPLETE_DETAILS",
            "missingFields": missing_fields,
            "banks": [],
        }

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

    return {
        "applicationId": app.id,
        "uniqueCustomerId": app.uniqueCustomerId,
        "customerName": customer_name,
        "productName": prod_name,
        "requestedAmount": float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 0.0),
        "cibilScore": cgd.cibil_score if cgd else None,
        "monthlyIncome": float(cgd.monthly_income if cgd and cgd.monthly_income else 0.0),
        "banks": compared_banks,
    }
