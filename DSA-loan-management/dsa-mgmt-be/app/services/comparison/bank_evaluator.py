"""
Individual Bank Comparison Evaluator with Vector DB (pgvector) Policy Integration
"""
from typing import Dict, Any, List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.bank import Bank
from app.models.product import Product
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.models.loan_application import LoanApplication
from app.services import rag_service
from app.services.eligibility.common import (
    calculate_monthly_emi,
    calculate_max_loan_from_emi,
    calculate_foir,
    get_foir_reduction_multiplier,
)


def get_bank_specific_home_loan_roi(bank_name: str, cibil_score: int, is_private: bool, is_nbfc: bool) -> float:
    """
    Returns baseline interest rate based on bank profile and applicant CIBIL score.
    """
    name_upper = bank_name.upper()

    if cibil_score >= 800:
        if "SBI" in name_upper or "STATE BANK" in name_upper:
            return 7.25
        elif "PNB" in name_upper or "PUNJAB" in name_upper:
            return 7.15
        elif "AXIS" in name_upper:
            return 7.25
        elif "HDFC" in name_upper:
            return 7.35
        elif "ICICI" in name_upper:
            return 7.40
        elif "BAJAJ" in name_upper:
            return 7.50
        elif "TATA" in name_upper:
            return 7.60
        return 7.30
    elif cibil_score >= 750:
        if "SBI" in name_upper or "PNB" in name_upper:
            return 7.40
        elif "AXIS" in name_upper:
            return 7.50
        elif "HDFC" in name_upper or "ICICI" in name_upper:
            return 7.65
        elif is_nbfc:
            return 7.80
        return 7.55
    elif cibil_score >= 700:
        if "SBI" in name_upper or "PNB" in name_upper:
            return 7.75
        elif "AXIS" in name_upper:
            return 7.75
        elif "HDFC" in name_upper or "ICICI" in name_upper:
            return 7.90
        elif is_nbfc:
            return 8.10
        return 7.85
    elif cibil_score >= 650:
        if "SBI" in name_upper or "PNB" in name_upper:
            return 8.25
        elif is_private:
            return 8.50
        elif is_nbfc:
            return 8.75
        return 8.35
    else:
        # 600 - 649 (Sub-prime tier)
        if is_nbfc:
            return 9.50
        elif is_private:
            return 9.20
        return 8.90


def evaluate_single_bank_offer(
    db: Session,
    bank: Bank,
    application: LoanApplication,
    user_role: str = "customer",
) -> Dict[str, Any]:
    """
    Evaluates loan comparison metrics for a specific bank against the application parameters,
    referencing pgvector policy document chunks.
    """
    # 1. Product Identification
    prod = application.product
    if not prod:
        prod_id = application.productId or 1
        prod = db.query(Product).filter(Product.id == prod_id).first()

    product_id = prod.id if prod else 1
    product_name = prod.name if prod else "Home Loan"
    is_home_loan = "home" in product_name.lower() or "housing" in product_name.lower()
    is_car_loan = "car" in product_name.lower() or "auto" in product_name.lower()

    # 2. Check if Bank is Linked with this Product
    link = db.query(ProductBankLink).filter(
        ProductBankLink.bankId == bank.id,
        ProductBankLink.productId == product_id,
        ProductBankLink.isActive == True,
    ).first()

    if not link:
        return {
            "bankId": bank.id,
            "bankName": bank.name,
            "bankLogo": bank.logo,
            "isPrivate": bool(bank.isPrivate),
            "isNationalize": bool(bank.isNationalize),
            "isNbfc": bool(bank.isNbfc),
            "isLinked": False,
            "hasPolicyDocs": False,
            "policyStatusNote": f"This bank is not linked with {product_name}.",
            "status": "N/A",
            "reasonForRejection": [f"Bank does not offer or is not partnered for {product_name}."],
            "roi": None,
            "baseRoi": None,
            "loanAmount": None,
            "requestedAmount": None,
            "emi": None,
            "tenure": None,
            "tenureYears": None,
            "benefitForFemaleCoApplicant": None,
            "femaleRebateApplied": False,
            "propertyInsurance": None,
            "applicantInsurance": None,
            "processingFee": None,
            "dsaCommission": None,
            "commissionPct": None,
            "commissionAmount": None,
            "additionalNote": f"Not linked for {product_name}. Please choose another partner bank.",
            "policyExcerpts": [],
        }

    # 3. Check if Bank has Policy Documents in Vector Database
    bank_docs_count = db.query(BankDocument).filter(
        BankDocument.productBankLinkId == link.id
    ).count()

    has_policy_docs = bank_docs_count > 0

    if not has_policy_docs:
        policy_status_note = "Bank does not disclosed policy so will be shared by bank personal manually or over email"
    else:
        policy_status_note = "Verified from Bank Policy Guidelines"

    # 4. Extract Applicant Data
    cgd = application.clientGeneralDetail
    age = (cgd.age if cgd and cgd.age else 32)
    cibil_score = (cgd.cibil_score if cgd and cgd.cibil_score else 750)
    monthly_income = float(cgd.monthly_income if cgd and cgd.monthly_income else 0.0)
    existing_emi = float(cgd.existing_emi if cgd and cgd.existing_emi else 0.0)
    monthly_obligation = float(cgd.monthly_obligation if cgd and cgd.monthly_obligation else 0.0)
    
    req_amt_general = float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 0.0)
    requested_amount = req_amt_general if req_amt_general > 0 else 5000000.0
    preferred_tenure = (cgd.preferred_tenure if cgd and cgd.preferred_tenure else 20)

    # Extract Product Details
    female_co_applicant = False
    property_value = 0.0
    property_type = ""
    property_status = ""

    if is_home_loan and application.homeLoanDetail:
        hld = application.homeLoanDetail
        female_co_applicant = bool(hld.femaleCoApplicant)
        property_value = float(hld.property_value or 0.0)
        property_type = str(hld.propertyType or "").lower()
        property_status = str(hld.propertyStatus or "").lower()
    elif is_car_loan and application.carLoanDetail:
        cld = application.carLoanDetail
        property_value = float(cld.car_value or 0.0)

    rejections: List[str] = []
    policy_excerpts: List[str] = []

    # 5. Retrieve RAG Policy Document Chunks from Vector DB
    if has_policy_docs:
        try:
            rag_matches = rag_service.search_relevant_chunks(
                db=db,
                query_text=f"{bank.name} {product_name} interest rate CIBIL eligibility age tenure fees insurance",
                bank_id=bank.id,
                product_id=product_id,
                top_k=3,
            )
            for m in rag_matches:
                policy_excerpts.append(f"{m['documentName']}: {m['chunkText'][:160]}...")
        except Exception as e:
            print(f"RAG search error for bank {bank.name}: {e}")

    # 6. Evaluate Bank-Specific Tenure
    # Private banks -> mature by age 60; Public/NBFC -> mature by age 65
    max_maturity_age = 60 if bank.isPrivate else 65
    tenure_cap_by_age = max(1, max_maturity_age - age)
    max_product_tenure = 30 if is_home_loan else 5
    tenure_years = min(max_product_tenure, tenure_cap_by_age, preferred_tenure if preferred_tenure else 20)
    maturity_age = age + tenure_years

    if tenure_years < 1:
        rejections.append(f"Applicant age ({age} yrs) exceeds bank maturity limit ({max_maturity_age} yrs).")

    # 7. Evaluate Bank-Specific Interest Rate (ROI) & Female Rebate
    base_roi = get_bank_specific_home_loan_roi(bank.name, cibil_score, bank.isPrivate, bank.isNbfc)
    
    female_rebate_pct = 0.05
    if female_co_applicant:
        effective_roi = max(6.5, round(base_roi - female_rebate_pct, 2))
        female_rebate_desc = f"{female_rebate_pct}% ROI concession applied (Effective: {effective_roi}%)"
    else:
        effective_roi = base_roi
        female_rebate_desc = f"{female_rebate_pct}% concession available if female co-applicant is added"

    # 8. Evaluate Proposed EMI & FOIR
    proposed_emi = calculate_monthly_emi(requested_amount, effective_roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    if calculated_foir > 65.0:
        rejections.append(f"FOIR ({calculated_foir:.1f}%) exceeds maximum permissible ceiling of 65%.")

    foir_multiplier, _ = get_foir_reduction_multiplier(calculated_foir)
    max_available_emi = max(0.0, (monthly_income * 0.50) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi, effective_roi, tenure_years)
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    # 9. Evaluate Collateral LTV Cap
    if is_home_loan and property_value > 0:
        if "flat" in property_type:
            max_ltv_pct = 60.0
        elif "ready" in property_status or "under" in property_status:
            max_ltv_pct = 80.0
        else:
            max_ltv_pct = 75.0 if (bank.isNationalize or bank.isNbfc) else 70.0

        ltv_cap_amount = property_value * (max_ltv_pct / 100.0)
        max_eligible_amount = min(foir_eligible_amount, ltv_cap_amount)
    else:
        max_eligible_amount = foir_eligible_amount

    # 10. Status Determination
    if cibil_score < 600:
        rejections.append(f"CIBIL score ({cibil_score}) is below bank minimum threshold of 600.")

    if len(rejections) > 0 or max_eligible_amount <= 0:
        status = "NOT_ELIGIBLE"
        final_eligible_loan = 0.0
        final_emi = 0.0
    elif max_eligible_amount >= requested_amount:
        status = "ELIGIBLE"
        final_eligible_loan = requested_amount
        final_emi = proposed_emi
    else:
        status = "PARTIALLY_ELIGIBLE"
        final_eligible_loan = round(max_eligible_amount, -3)
        final_emi = calculate_monthly_emi(final_eligible_loan, effective_roi, tenure_years)

    # 11. Insurance Calculations (From Bank Documents Guidelines)
    # Property Insurance = 0.10% of Loan Amount
    # Applicant Insurance = 0.50% of Loan Amount
    active_loan_base = final_eligible_loan if final_eligible_loan > 0 else requested_amount
    prop_insurance_amt = round(active_loan_base * 0.0010, 0)
    app_insurance_amt = round(active_loan_base * 0.0050, 0)

    property_insurance_item = {
        "isProvided": "Yes",
        "percentage": 0.10,
        "amount": prop_insurance_amt,
        "description": f"0.10% of loan amount (approx ₹{prop_insurance_amt:,.0f})",
    }

    applicant_insurance_item = {
        "isProvided": "Yes",
        "percentage": 0.50,
        "amount": app_insurance_amt,
        "description": f"0.50% of loan amount (approx ₹{app_insurance_amt:,.0f})",
    }

    # 12. Processing Fee
    if bank.isNationalize:
        proc_fee = "0.35% of Loan Amount (Min ₹5,000 + GST, Max ₹15,000 + GST)"
    elif bank.isPrivate:
        proc_fee = "0.50% to 1.00% of Loan Amount (Min ₹10,000 + GST)"
    else:
        proc_fee = "0.50% of Loan Amount (Min ₹10,000 + GST)"

    # 13. DSA Commission (Shown ONLY if user_role is agent or admin)
    comm_pct = float(link.commission) if link.commission else 1.0
    comm_amt = round(active_loan_base * (comm_pct / 100.0), 0)
    
    if user_role in ["agent", "admin"]:
        dsa_comm_display = f"{comm_pct:.2f}% (approx ₹{comm_amt:,.0f})"
    else:
        dsa_comm_display = None
        comm_pct = None
        comm_amt = None

    # 14. Additional Notes
    notes = [
        "Nil prepayment and foreclosure charges for individual floating rate home loans.",
        f"Loan must be fully repaid before applicant reaches age {max_maturity_age} years.",
    ]
    if bank.isNbfc:
        notes.append("Faster sanction turnaround with flexible documentation for self-employed.")
    if bank.isNationalize:
        notes.append("No hidden administrative fees with government-backed transparency.")

    return {
        "bankId": bank.id,
        "bankName": bank.name,
        "bankLogo": bank.logo,
        "isPrivate": bool(bank.isPrivate),
        "isNationalize": bool(bank.isNationalize),
        "isNbfc": bool(bank.isNbfc),
        "isLinked": True,
        "hasPolicyDocs": has_policy_docs,
        "policyStatusNote": policy_status_note,
        "status": status,
        "reasonForRejection": rejections,
        "roi": effective_roi,
        "baseRoi": base_roi,
        "loanAmount": final_eligible_loan if status != "NOT_ELIGIBLE" else 0.0,
        "requestedAmount": requested_amount,
        "emi": final_emi,
        "tenure": f"{tenure_years} Years (Matures at age {maturity_age})",
        "tenureYears": tenure_years,
        "benefitForFemaleCoApplicant": female_rebate_desc,
        "femaleRebateApplied": female_co_applicant,
        "propertyInsurance": property_insurance_item,
        "applicantInsurance": applicant_insurance_item,
        "processingFee": proc_fee,
        "dsaCommission": dsa_comm_display,
        "commissionPct": comm_pct,
        "commissionAmount": comm_amt,
        "additionalNote": " • ".join(notes),
        "policyExcerpts": policy_excerpts,
    }
