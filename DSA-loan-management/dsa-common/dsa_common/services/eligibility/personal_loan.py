"""
Personal Loan Underwriting Evaluation Engine
"""
from typing import Dict, Any, List
from dsa_common.models.loan_application import LoanApplication
from dsa_common.constants import (
    PERSONAL_LOAN_MAX_TENURE_YEARS,
    PERSONAL_LOAN_PRODUCT_MAX_CAP,
    PERSONAL_LOAN_ROI_TIER_1,
    PERSONAL_LOAN_ROI_TIER_2,
    PERSONAL_LOAN_ROI_TIER_3,
    PERSONAL_LOAN_ROI_TIER_4,
    MIN_CIBIL_SCORE,
    CIBIL_TIER_EXCELLENT,
    CIBIL_TIER_GOOD,
    CIBIL_TIER_FAIR,
    FOIR_INCOME_ALLOCATION_PCT,
    MIN_GROSS_MONTHLY_INCOME,
)
from dsa_common.services.eligibility.common import (
    calculate_monthly_emi,
    calculate_max_loan_from_emi,
    calculate_foir,
    get_foir_reduction_multiplier,
)


def evaluate_personal_loan_eligibility(app: LoanApplication) -> Dict[str, Any]:
    """
    Comprehensive underwriting evaluation for Unsecured Personal Loan applications.
    """
    cgd = app.clientGeneralDetail
    pld = app.personalLoanDetail

    age = int(cgd.age) if cgd and cgd.age else 0
    cibil_score = int(cgd.cibil_score) if cgd and cgd.cibil_score else 0
    monthly_income = float(cgd.monthly_income if cgd and cgd.monthly_income else 0.0)
    existing_emi = float(cgd.existing_emi if cgd and cgd.existing_emi else 0.0)
    monthly_obligation = float(cgd.monthly_obligation if cgd and cgd.monthly_obligation else 0.0)

    req_amt_pl = 0.0
    if pld:
        if pld.loan_amount_required is not None:
            req_amt_pl = float(pld.loan_amount_required)
        elif pld.required_amount is not None:
            req_amt_pl = float(pld.required_amount)
    req_amt_gen = float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 0.0)
    requested_amount = req_amt_pl if req_amt_pl > 0 else req_amt_gen

    pref_tenure_pl = int(pld.preferred_tenure if pld and pld.preferred_tenure else 0)
    pref_tenure_gen = int(cgd.preferred_tenure if cgd and cgd.preferred_tenure else 0)
    preferred_tenure = pref_tenure_pl if pref_tenure_pl > 0 else pref_tenure_gen

    positive_factors: List[str] = []
    reduction_reasons: List[str] = []
    rejection_reasons: List[str] = []

    # 1. Hard Gate Checks
    if monthly_income < MIN_GROSS_MONTHLY_INCOME:
        rejection_reasons.append(f"Gross monthly income (₹{monthly_income:,.0f}) is below minimum requirement of ₹{MIN_GROSS_MONTHLY_INCOME:,.0f}.")

    if cibil_score < MIN_CIBIL_SCORE:
        rejection_reasons.append(f"CIBIL score ({cibil_score}) is below minimum credit threshold of {MIN_CIBIL_SCORE}.")
    elif cibil_score >= CIBIL_TIER_EXCELLENT:
        positive_factors.append(f"Excellent CIBIL score ({cibil_score}) qualifies applicant for Tier-1 prime rates.")

    # 2. Tenure Cap
    eligible_tenure_years = min(PERSONAL_LOAN_MAX_TENURE_YEARS, preferred_tenure if preferred_tenure > 0 else PERSONAL_LOAN_MAX_TENURE_YEARS)

    # 3. Interest Rate
    if cibil_score >= CIBIL_TIER_EXCELLENT:
        roi = PERSONAL_LOAN_ROI_TIER_1
    elif cibil_score >= CIBIL_TIER_GOOD:
        roi = PERSONAL_LOAN_ROI_TIER_2
    elif cibil_score >= CIBIL_TIER_FAIR:
        roi = PERSONAL_LOAN_ROI_TIER_3
    else:
        roi = PERSONAL_LOAN_ROI_TIER_4

    # 4. Proposed EMI & FOIR
    proposed_emi = calculate_monthly_emi(requested_amount, roi, eligible_tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)
    if foir_multiplier == 0.0:
        rejection_reasons.append(foir_msg)
    elif foir_multiplier < 1.0:
        reduction_reasons.append(foir_msg)

    # 5. Income Capacity
    max_available_emi = max(0.0, (monthly_income * FOIR_INCOME_ALLOCATION_PCT) - existing_emi - monthly_obligation)
    foir_max_unscaled = calculate_max_loan_from_emi(max_available_emi, roi, eligible_tenure_years)
    foir_eligible = foir_max_unscaled * foir_multiplier if foir_multiplier > 0 else 0.0

    # 6. Unsecured Cap
    if foir_eligible > PERSONAL_LOAN_PRODUCT_MAX_CAP:
        reduction_reasons.append(f"Loan eligibility capped at maximum unsecured lending limit of ₹{PERSONAL_LOAN_PRODUCT_MAX_CAP:,.0f}.")
        max_eligible_amount = PERSONAL_LOAN_PRODUCT_MAX_CAP
    else:
        max_eligible_amount = foir_eligible

    # 7. Status
    if len(rejection_reasons) > 0 or max_eligible_amount <= 0:
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
        final_emi = calculate_monthly_emi(final_eligible_loan, roi, eligible_tenure_years)

    income_surplus = max(0.0, monthly_income - existing_emi - monthly_obligation - final_emi)

    return {
        "applicationId": app.id,
        "productType": "personal_loan",
        "productName": "Personal Loan",
        "status": status,
        "requestedAmount": requested_amount,
        "eligibleLoanAmount": final_eligible_loan,
        "maxEligibleAmount": round(max_eligible_amount, 2),
        "interestRatePct": roi,
        "monthlyEmi": final_emi,
        "tenureYears": eligible_tenure_years,
        "calculatedFoir": calculated_foir,
        "monthlyIncome": monthly_income,
        "incomeSurplus": round(income_surplus, 2),
        "cibilScore": cibil_score,
        "positiveFactors": positive_factors,
        "reductionReasons": reduction_reasons,
        "rejectionReasons": rejection_reasons,
    }
