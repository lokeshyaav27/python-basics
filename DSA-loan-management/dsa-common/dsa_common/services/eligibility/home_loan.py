"""
Home Loan Underwriting Evaluation Engine
"""
from typing import Dict, Any, List
from dsa_common.models.loan_application import LoanApplication
from dsa_common.constants import (
    HOME_LOAN_MAX_TENURE_YEARS,
    HOME_LOAN_MAX_MATURITY_AGE,
    HOME_LOAN_FEMALE_CO_APPLICANT_REBATE,
    HOME_LOAN_MIN_ROI_FLOOR,
    HOME_LOAN_LTV_FLAT_APARTMENT,
    HOME_LOAN_LTV_STANDARD,
    HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION,
    HOME_LOAN_ROI_TIER_1,
    HOME_LOAN_ROI_TIER_2,
    HOME_LOAN_ROI_TIER_3,
    HOME_LOAN_ROI_TIER_4,
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


def evaluate_home_loan_eligibility(app: LoanApplication) -> Dict[str, Any]:
    """
    Comprehensive underwriting evaluation for Home Loan applications.
    """
    cgd = app.clientGeneralDetail
    hld = app.homeLoanDetail

    # 1. Extract Applicant Parameters
    age = int(cgd.age) if cgd and cgd.age else 0
    cibil_score = int(cgd.cibil_score) if cgd and cgd.cibil_score else 0
    monthly_income = float(cgd.monthly_income if cgd and cgd.monthly_income else 0.0)
    existing_emi = float(cgd.existing_emi if cgd and cgd.existing_emi else 0.0)
    monthly_obligation = float(cgd.monthly_obligation if cgd and cgd.monthly_obligation else 0.0)

    req_amt_hl = float(hld.loan_amount_required if hld and hld.loan_amount_required else 0.0)
    req_amt_gen = float(cgd.loan_amount_required if cgd and cgd.loan_amount_required else 0.0)
    requested_amount = req_amt_hl if req_amt_hl > 0 else req_amt_gen

    pref_tenure_hl = int(hld.preferred_tenure if hld and hld.preferred_tenure else 0)
    pref_tenure_gen = int(cgd.preferred_tenure if cgd and cgd.preferred_tenure else 0)
    preferred_tenure = pref_tenure_hl if pref_tenure_hl > 0 else pref_tenure_gen

    property_value = float(hld.property_value if hld and hld.property_value else 0.0)
    property_type = str(hld.propertyType or "").lower() if hld else ""
    property_status = str(hld.propertyStatus or "").lower() if hld else ""
    female_co_applicant = bool(hld.femaleCoApplicant) if hld else False

    positive_factors: List[str] = []
    reduction_reasons: List[str] = []
    rejection_reasons: List[str] = []

    # 2. Hard Gate Checks
    if monthly_income < MIN_GROSS_MONTHLY_INCOME:
        rejection_reasons.append(f"Gross monthly income (₹{monthly_income:,.0f}) is below minimum requirement of ₹{MIN_GROSS_MONTHLY_INCOME:,.0f}.")

    if cibil_score < MIN_CIBIL_SCORE:
        rejection_reasons.append(f"CIBIL score ({cibil_score}) is below minimum credit threshold of {MIN_CIBIL_SCORE}.")
    elif cibil_score >= CIBIL_TIER_EXCELLENT:
        positive_factors.append(f"Excellent CIBIL score ({cibil_score}) qualifies applicant for Tier-1 prime interest rates.")
    elif cibil_score >= CIBIL_TIER_GOOD:
        positive_factors.append(f"Good CIBIL score ({cibil_score}) meets prime lending criteria.")

    # 3. Tenure Calculation
    tenure_cap_by_age = max(1, HOME_LOAN_MAX_MATURITY_AGE - age)
    eligible_tenure_years = min(
        HOME_LOAN_MAX_TENURE_YEARS,
        tenure_cap_by_age,
        preferred_tenure if preferred_tenure > 0 else HOME_LOAN_MAX_TENURE_YEARS,
    )
    if eligible_tenure_years < 1:
        rejection_reasons.append(f"Applicant age ({age} yrs) exceeds maximum permissible maturity age ({HOME_LOAN_MAX_MATURITY_AGE} yrs).")
    elif eligible_tenure_years < preferred_tenure:
        reduction_reasons.append(f"Tenure capped from {preferred_tenure} yrs to {eligible_tenure_years} yrs based on applicant age {age} (maturity at {HOME_LOAN_MAX_MATURITY_AGE} yrs).")

    # 4. Interest Rate Determination
    if cibil_score >= CIBIL_TIER_EXCELLENT:
        base_roi = HOME_LOAN_ROI_TIER_1
    elif cibil_score >= CIBIL_TIER_GOOD:
        base_roi = HOME_LOAN_ROI_TIER_2
    elif cibil_score >= CIBIL_TIER_FAIR:
        base_roi = HOME_LOAN_ROI_TIER_3
    else:
        base_roi = HOME_LOAN_ROI_TIER_4

    effective_roi = base_roi
    female_rebate_applied = False
    if female_co_applicant:
        effective_roi = max(HOME_LOAN_MIN_ROI_FLOOR, base_roi - HOME_LOAN_FEMALE_CO_APPLICANT_REBATE)
        female_rebate_applied = True
        positive_factors.append(f"Female co-applicant rebate of {HOME_LOAN_FEMALE_CO_APPLICANT_REBATE}% p.a. applied (effective ROI: {effective_roi}%).")

    # 5. Proposed EMI and FOIR Analysis
    proposed_emi = calculate_monthly_emi(requested_amount, effective_roi, eligible_tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)
    if foir_multiplier == 0.0:
        rejection_reasons.append(foir_msg)
    elif foir_multiplier < 1.0:
        reduction_reasons.append(foir_msg)
    else:
        positive_factors.append(f"Healthy debt-to-income ratio (FOIR: {calculated_foir:.1f}%).")

    # 6. Income-based Loan Capacity
    max_available_emi = max(0.0, (monthly_income * FOIR_INCOME_ALLOCATION_PCT) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi, effective_roi, eligible_tenure_years)
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    # 7. Collateral LTV Cap Analysis
    if "flat" in property_type or "apartment" in property_type:
        max_ltv_pct = HOME_LOAN_LTV_FLAT_APARTMENT
        ltv_desc = f"Flat/Apartment LTV cap ({HOME_LOAN_LTV_FLAT_APARTMENT}%)"
    elif "ready" in property_status or "under" in property_status:
        max_ltv_pct = HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION
        ltv_desc = f"Ready/Under Construction LTV cap ({HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION}%)"
    else:
        max_ltv_pct = HOME_LOAN_LTV_STANDARD
        ltv_desc = f"Standard Home Loan LTV cap ({HOME_LOAN_LTV_STANDARD}%)"

    ltv_max_amount = property_value * (max_ltv_pct / 100.0) if property_value > 0 else foir_eligible_amount

    if property_value > 0 and ltv_max_amount < foir_eligible_amount:
        reduction_reasons.append(f"Loan eligibility capped by {ltv_desc} against property value ₹{property_value:,.0f} (max LTV loan: ₹{ltv_max_amount:,.0f}).")

    max_eligible_amount = min(foir_eligible_amount, ltv_max_amount)

    # 8. Final Eligibility Status Determination
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
        final_emi = calculate_monthly_emi(final_eligible_loan, effective_roi, eligible_tenure_years)

    income_surplus = max(0.0, monthly_income - existing_emi - monthly_obligation - final_emi)

    return {
        "applicationId": app.id,
        "productType": "home_loan",
        "productName": "Home Loan",
        "status": status,
        "requestedAmount": requested_amount,
        "eligibleLoanAmount": final_eligible_loan,
        "maxEligibleAmount": round(max_eligible_amount, 2),
        "interestRatePct": effective_roi,
        "baseInterestRatePct": base_roi,
        "femaleRebateApplied": female_rebate_applied,
        "monthlyEmi": final_emi,
        "tenureYears": eligible_tenure_years,
        "calculatedFoir": calculated_foir,
        "maxPermissibleLtvPct": max_ltv_pct if property_value > 0 else None,
        "propertyValue": property_value if property_value > 0 else None,
        "monthlyIncome": monthly_income,
        "incomeSurplus": round(income_surplus, 2),
        "cibilScore": cibil_score,
        "positiveFactors": positive_factors,
        "reductionReasons": reduction_reasons,
        "rejectionReasons": rejection_reasons,
    }
