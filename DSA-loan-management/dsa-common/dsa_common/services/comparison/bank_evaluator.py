"""
Single Bank Offer Evaluation Engine for Loan Comparison
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from dsa_common.models.bank import Bank
from dsa_common.models.product import Product
from dsa_common.models.product_bank_link import ProductBankLink
from dsa_common.models.bank_document import BankDocument
from dsa_common.models.loan_application import LoanApplication
from dsa_common.constants import (
    BANK_MATURITY_AGE_PRIVATE,
    BANK_MATURITY_AGE_PUBLIC_NBFC,
    BANK_COMPARISON_FEMALE_REBATE_PCT,
    BANK_COMPARISON_MIN_ROI_FLOOR,
    HOME_LOAN_MAX_TENURE_YEARS,
    CAR_LOAN_MAX_TENURE_YEARS,
    HOME_LOAN_LTV_FLAT_APARTMENT,
    HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION,
    HOME_LOAN_LTV_STANDARD,
    FOIR_MAX_CEILING,
    FOIR_INCOME_ALLOCATION_PCT,
    MIN_CIBIL_SCORE,
)
from dsa_common.services.eligibility.common import (
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
    Evaluates loan comparison metrics for a specific bank against the application parameters.
    """
    prod = application.product
    if not prod:
        prod_id = application.productId or 1
        prod = db.query(Product).filter(Product.id == prod_id).first()

    product_id = prod.id if prod else 1
    product_name = prod.name if prod else "Home Loan"
    is_home_loan = "home" in product_name.lower() or "housing" in product_name.lower()
    is_car_loan = "car" in product_name.lower() or "auto" in product_name.lower()

    link = db.query(ProductBankLink).filter(
        ProductBankLink.bankId == bank.id,
        ProductBankLink.productId == product_id,
        ProductBankLink.isActive != False,
    ).first()

    if not link:
        return {
            "bankId": bank.id,
            "bankName": bank.name,
            "isPrivate": bool(bank.isPrivate),
            "isNationalize": bool(bank.isNationalize),
            "isNbfc": bool(bank.isNbfc),
            "isLinked": False,
            "status": "N/A",
            "rejectionReasons": [f"Bank does not offer or is not partnered for {product_name}."],
            "roi": None,
            "interestRatePct": None,
            "loanAmount": None,
            "maxEligibleAmount": None,
            "emi": None,
            "monthlyEmi": None,
            "tenureYears": None,
            "benefitForFemaleCoApplicant": None,
            "processingFee": None,
            "dsaCommission": None,
            "commissionPct": None,
            "commissionAmount": None,
        }

    bank_docs_count = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).count()
    has_policy_docs = bank_docs_count > 0

    cgd = application.clientGeneralDetail
    age = int(cgd.age) if cgd and cgd.age else 0
    cibil_score = int(cgd.cibil_score) if cgd and cgd.cibil_score else 0
    monthly_income = float(cgd.monthly_income if cgd and cgd.monthly_income else 0.0)
    existing_emi = float(cgd.existing_emi if cgd and cgd.existing_emi else 0.0)
    monthly_obligation = float(cgd.monthly_obligation if cgd and cgd.monthly_obligation else 0.0)

    req_amt_prod = 0.0
    pref_tenure_prod = 0
    if is_home_loan and application.homeLoanDetail:
        if application.homeLoanDetail.loan_amount_required is not None:
            req_amt_prod = float(application.homeLoanDetail.loan_amount_required)
        if application.homeLoanDetail.preferred_tenure is not None:
            pref_tenure_prod = int(application.homeLoanDetail.preferred_tenure)
    elif is_car_loan and application.carLoanDetail:
        if application.carLoanDetail.loan_amount_required is not None:
            req_amt_prod = float(application.carLoanDetail.loan_amount_required)
        if application.carLoanDetail.preferred_tenure is not None:
            pref_tenure_prod = int(application.carLoanDetail.preferred_tenure)
    elif application.personalLoanDetail:
        req_val = application.personalLoanDetail.loan_amount_required if application.personalLoanDetail.loan_amount_required is not None else application.personalLoanDetail.required_amount
        if req_val is not None:
            req_amt_prod = float(req_val)
        if application.personalLoanDetail.preferred_tenure is not None:
            pref_tenure_prod = int(application.personalLoanDetail.preferred_tenure)

    req_amt_general = float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 0.0)
    requested_amount = req_amt_prod if req_amt_prod > 0 else req_amt_general
    preferred_tenure = pref_tenure_prod if pref_tenure_prod > 0 else int(cgd.preferred_tenure if cgd and cgd.preferred_tenure else 0)

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
    policy = link.policyParameters or {}

    if policy and "max_maturity_age_salaried" in policy:
        max_maturity_age = int(policy.get("max_maturity_age_salaried", 60) if bank.isPrivate else policy.get("max_maturity_age_self_employed", 65))
    else:
        max_maturity_age = BANK_MATURITY_AGE_PRIVATE if bank.isPrivate else BANK_MATURITY_AGE_PUBLIC_NBFC

    tenure_cap_by_age = max(1, max_maturity_age - age)
    max_product_tenure = int(policy.get("max_tenure_years")) if (policy and policy.get("max_tenure_years")) else (HOME_LOAN_MAX_TENURE_YEARS if is_home_loan else CAR_LOAN_MAX_TENURE_YEARS)
    tenure_years = min(max_product_tenure, tenure_cap_by_age, preferred_tenure if preferred_tenure > 0 else max_product_tenure)

    if tenure_years < 1:
        rejections.append(f"Applicant age ({age} yrs) exceeds bank maturity limit ({max_maturity_age} yrs).")

    if policy and "roi_tier_1_cibil_750_plus" in policy:
        if cibil_score >= 750:
            base_roi = float(policy.get("roi_tier_1_cibil_750_plus", 7.35))
        elif cibil_score >= 700:
            base_roi = float(policy.get("roi_tier_2_cibil_700_749", 7.65))
        elif cibil_score >= 650:
            base_roi = float(policy.get("roi_tier_3_cibil_650_699", 8.10))
        else:
            base_roi = float(policy.get("roi_tier_4_cibil_below_650", 8.75))
    else:
        base_roi = get_bank_specific_home_loan_roi(bank.name, cibil_score, bank.isPrivate, bank.isNbfc)
    
    female_rebate_pct = float(policy.get("female_rebate_pct", BANK_COMPARISON_FEMALE_REBATE_PCT)) if policy else BANK_COMPARISON_FEMALE_REBATE_PCT
    female_fee_concession_pct = float(policy.get("female_fee_concession_pct", 0.0)) if policy else 0.0
    min_roi_floor = float(policy.get("min_roi_floor", BANK_COMPARISON_MIN_ROI_FLOOR)) if policy else BANK_COMPARISON_MIN_ROI_FLOOR

    if female_co_applicant:
        effective_roi = max(min_roi_floor, round(base_roi - female_rebate_pct, 2))
        benefit_parts = []
        if female_rebate_pct > 0:
            benefit_parts.append(f"{female_rebate_pct}% ROI concession applied")
        if female_fee_concession_pct > 0:
            benefit_parts.append(f"{female_fee_concession_pct:.0f}% Processing Fee discount applied")
        female_rebate_desc = " & ".join(benefit_parts) if benefit_parts else "None"
    else:
        effective_roi = base_roi
        benefit_parts = []
        if female_rebate_pct > 0:
            benefit_parts.append(f"{female_rebate_pct}% ROI concession")
        if female_fee_concession_pct > 0:
            benefit_parts.append(f"{female_fee_concession_pct:.0f}% Fee discount")
        female_rebate_desc = f"{' & '.join(benefit_parts)} if female co-applicant added" if benefit_parts else "None"

    proposed_emi = calculate_monthly_emi(requested_amount, effective_roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    if calculated_foir > FOIR_MAX_CEILING:
        rejections.append(f"FOIR ({calculated_foir:.1f}%) exceeds maximum permissible ceiling of {FOIR_MAX_CEILING:.0f}%.")

    foir_multiplier, _ = get_foir_reduction_multiplier(calculated_foir)
    max_available_emi = max(0.0, (monthly_income * FOIR_INCOME_ALLOCATION_PCT) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi, effective_roi, tenure_years)
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    if is_home_loan and property_value > 0:
        if "flat" in property_type:
            max_ltv_pct = float(policy.get("ltv_flat_pct", HOME_LOAN_LTV_FLAT_APARTMENT)) if policy else HOME_LOAN_LTV_FLAT_APARTMENT
        elif "ready" in property_status or "under" in property_status:
            max_ltv_pct = float(policy.get("ltv_ready_pct", HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION)) if policy else HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION
        else:
            max_ltv_pct = float(policy.get("ltv_standard_pct", 75.0 if (bank.isNationalize or bank.isNbfc) else HOME_LOAN_LTV_STANDARD)) if policy else (75.0 if (bank.isNationalize or bank.isNbfc) else HOME_LOAN_LTV_STANDARD)

        ltv_cap_amount = property_value * (max_ltv_pct / 100.0)
        max_eligible_amount = min(foir_eligible_amount, ltv_cap_amount)
    else:
        max_eligible_amount = foir_eligible_amount

    min_cibil_req = int(policy.get("min_cibil", MIN_CIBIL_SCORE)) if policy else MIN_CIBIL_SCORE
    if cibil_score < min_cibil_req:
        rejections.append(f"CIBIL score ({cibil_score}) is below bank minimum threshold of {min_cibil_req}.")

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

    # Processing Fee
    proc_fee = "0.50% of Loan Amount (Min ₹10,000 + GST)"
    if policy and "processing_fee_pct" in policy:
        proc_pct = float(policy.get("processing_fee_pct", 0.50))
        min_fee = float(policy.get("min_processing_fee", 5000.0))
        max_fee = float(policy.get("max_processing_fee", 25000.0))
        proc_fee = f"{proc_pct:.2f}% of Loan Amount (Min ₹{min_fee:,.0f}, Max ₹{max_fee:,.0f} + GST)"

    # Insurance
    active_loan_base = final_eligible_loan if final_eligible_loan > 0 else requested_amount
    ins_amount = round(active_loan_base * 0.005, 0)

    # DSA Commission
    comm_pct = float(link.commission) if link.commission else 1.0
    comm_amt = round(active_loan_base * (comm_pct / 100.0), 0)

    return {
        "bankId": bank.id,
        "bankName": bank.name,
        "isPrivate": bool(bank.isPrivate),
        "isNationalize": bool(bank.isNationalize),
        "isNbfc": bool(bank.isNbfc),
        "isLinked": True,
        "hasPolicyDocs": has_policy_docs,
        "status": status,
        "rejectionReasons": rejections,
        "interestRatePct": effective_roi,
        "roi": effective_roi,
        "loanAmount": final_eligible_loan if status != "NOT_ELIGIBLE" else 0.0,
        "monthlyEmi": final_emi,
        "tenureYears": tenure_years,
        "benefitForFemaleCoApplicant": female_rebate_desc,
        "femaleRebateApplied": female_co_applicant,
        "processingFee": proc_fee,
        "insuranceAmount": ins_amount,
        "commissionPct": comm_pct if user_role in ["agent", "admin"] else None,
        "commissionAmount": comm_amt if user_role in ["agent", "admin"] else None,
    }
