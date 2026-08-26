"""
Home Loan Eligibility Evaluation Service
Implements rules from DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List, Tuple
from app.core.constants import (
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
    CIBIL_TIER_EXCELLENT,
    CIBIL_TIER_GOOD,
    CIBIL_TIER_FAIR,
    FOIR_MAX_CEILING,
    FOIR_BENCHMARK_NORMAL,
    FOIR_INCOME_ALLOCATION_PCT,
)
from .common import (
    calculate_monthly_emi,
    calculate_max_loan_from_emi,
    calculate_foir,
    get_foir_reduction_multiplier,
    validate_common_eligibility_checks,
)


def get_home_loan_interest_rate(cibil_score: int, female_co_applicant: bool = False) -> Tuple[float, float, float]:
    """
    Determines baseline Home Loan interest rate by CIBIL tier:
    - >= 750: Tier 1
    - 700 - 749: Tier 2
    - 650 - 699: Tier 3
    - < 650: Tier 4
    Female Co-applicant gives rebate.
    """
    if cibil_score is None or cibil_score >= CIBIL_TIER_EXCELLENT:
        base_rate = HOME_LOAN_ROI_TIER_1
    elif cibil_score >= CIBIL_TIER_GOOD:
        base_rate = HOME_LOAN_ROI_TIER_2
    elif cibil_score >= CIBIL_TIER_FAIR:
        base_rate = HOME_LOAN_ROI_TIER_3
    else:
        base_rate = HOME_LOAN_ROI_TIER_4

    rebate = HOME_LOAN_FEMALE_CO_APPLICANT_REBATE if female_co_applicant else 0.0
    effective_rate = max(HOME_LOAN_MIN_ROI_FLOOR, base_rate - rebate)
    return effective_rate, base_rate, rebate


def evaluate_home_loan_eligibility(
    applicant_data: Dict[str, Any],
    home_detail_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluates complete Home Loan eligibility per DSA guidelines.
    """
    rejections: List[str] = []
    positive_factors: List[str] = []
    reduction_notes: List[str] = []

    # Extract Applicant fields
    age = int(applicant_data.get("age") or 0)
    cibil_score = int(applicant_data.get("cibil_score") or 0)
    monthly_income = float(applicant_data.get("monthly_income") or 0.0)
    existing_emi = float(applicant_data.get("existing_emi") or 0.0)
    monthly_obligation = float(applicant_data.get("monthly_obligation") or 0.0)
    requested_amount = float(applicant_data.get("loan_amount_required") or 0.0)
    preferred_tenure = int(applicant_data.get("preferred_tenure") or 0)

    # Extract Home Detail fields
    property_value = float(home_detail_data.get("property_value") or 0.0)
    property_type = str(home_detail_data.get("propertyType") or "").lower()
    property_status = str(home_detail_data.get("propertyStatus") or "").lower()
    female_co_applicant = bool(home_detail_data.get("femaleCoApplicant", False))

    # 1. Common Baseline Validation
    is_valid_common, common_rejections = validate_common_eligibility_checks(age, cibil_score, monthly_income)
    rejections.extend(common_rejections)

    # 2. Tenure Calculation (Loan must mature before max age limit; product max tenure)
    max_age_tenure = max(1, HOME_LOAN_MAX_MATURITY_AGE - age)
    tenure_years = min(HOME_LOAN_MAX_TENURE_YEARS, max_age_tenure, preferred_tenure if preferred_tenure > 0 else HOME_LOAN_MAX_TENURE_YEARS)
    if tenure_years < 1:
        rejections.append(f"Age {age} leaves insufficient time before maximum age limit ({HOME_LOAN_MAX_MATURITY_AGE} years) to service a loan.")
    else:
        positive_factors.append(f"Applicable loan tenure: {tenure_years} years (matures before age {HOME_LOAN_MAX_MATURITY_AGE}).")

    # 3. Interest Rate Determination
    effective_roi, base_roi, rebate = get_home_loan_interest_rate(cibil_score, female_co_applicant)
    if female_co_applicant:
        positive_factors.append(f"Special {HOME_LOAN_FEMALE_CO_APPLICANT_REBATE}% female co-applicant concession applied (ROI: {effective_roi}% vs base {base_roi}%).")
    else:
        positive_factors.append(f"Interest rate: {effective_roi}% per annum based on CIBIL tier ({cibil_score}).")

    # 4. Property LTV Cap Evaluation
    if "flat" in property_type or "apartment" in property_type:
        max_ltv_pct = HOME_LOAN_LTV_FLAT_APARTMENT
        ltv_desc = f"Flat/Apartment category (Max {max_ltv_pct:.0f}% LTV)"
    elif "under" in property_status or "ready" in property_status:
        max_ltv_pct = HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION
        ltv_desc = f"Ready-to-move / Under-construction property (Max {max_ltv_pct:.0f}% LTV)"
    else:
        max_ltv_pct = HOME_LOAN_LTV_STANDARD
        ltv_desc = f"Standard property valuation (Max {max_ltv_pct:.0f}% LTV)"

    ltv_cap_amount = (property_value * max_ltv_pct / 100.0) if property_value > 0 else 0.0

    # 5. Proposed EMI & FOIR Evaluation for Requested Amount
    proposed_emi = calculate_monthly_emi(requested_amount, effective_roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    # 6. FOIR Assessment & Multiplier
    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)

    if calculated_foir > FOIR_MAX_CEILING:
        rejections.append(f"Fixed Obligation to Income Ratio (FOIR) is {calculated_foir:.1f}%, exceeding the maximum {FOIR_MAX_CEILING:.0f}% ceiling.")
    elif calculated_foir > FOIR_BENCHMARK_NORMAL:
        reduction_notes.append(f"{foir_msg}. Proposed obligations consume {calculated_foir:.1f}% of gross income.")
    else:
        positive_factors.append(f"Healthy FOIR of {calculated_foir:.1f}% (within normal <= {FOIR_BENCHMARK_NORMAL:.0f}% limit).")

    # 7. Maximum FOIR-Supported Loan Calculation
    max_available_emi_for_proposed = max(0.0, (monthly_income * FOIR_INCOME_ALLOCATION_PCT) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi_for_proposed, effective_roi, tenure_years)
    
    # Scale with FOIR multiplier if in the 50-65% bracket
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    # 8. Combined Max Eligible Calculation
    # Eligible amount is MIN(FOIR-eligible, LTV-cap)
    if ltv_cap_amount > 0:
        max_eligible_amount = min(foir_eligible_amount, ltv_cap_amount)
        if ltv_cap_amount < foir_eligible_amount:
            reduction_notes.append(f"Loan amount is capped at ₹{ltv_cap_amount:,.0f} due to {ltv_desc}.")
    else:
        max_eligible_amount = foir_eligible_amount

    # 9. Final Decision Determination
    actual_ltv = round((requested_amount / property_value) * 100.0, 1) if property_value > 0 else 0.0

    if len(rejections) > 0 or max_eligible_amount <= 0:
        status = "NOT_ELIGIBLE"
        final_eligible_amount = 0.0
        final_emi = 0.0
    elif max_eligible_amount >= requested_amount:
        status = "ELIGIBLE"
        final_eligible_amount = requested_amount
        final_emi = proposed_emi
    else:
        status = "PARTIALLY_ELIGIBLE"
        final_eligible_amount = round(max_eligible_amount, -3)  # Round to nearest thousand
        final_emi = calculate_monthly_emi(final_eligible_amount, effective_roi, tenure_years)
        reduction_notes.append(
            f"Eligible for a maximum of ₹{final_eligible_amount:,.0f} (instead of requested ₹{requested_amount:,.0f}) to maintain safe debt ratios."
        )

    return {
        "productType": "Home Loan",
        "status": status,
        "requestedAmount": requested_amount,
        "eligibleAmount": final_eligible_amount,
        "proposedEmi": final_emi,
        "interestRatePct": effective_roi,
        "baseInterestRatePct": base_roi,
        "femaleRebateApplied": female_co_applicant,
        "tenureYears": tenure_years,
        "foirPct": calculated_foir,
        "maxAllowedFoirPct": 65.0,
        "ltvPct": actual_ltv,
        "maxAllowedLtvPct": max_ltv_pct,
        "propertyValue": property_value,
        "monthlyIncome": monthly_income,
        "existingEmi": existing_emi,
        "monthlyObligation": monthly_obligation,
        "cibilScore": cibil_score,
        "rejections": rejections,
        "positiveFactors": positive_factors,
        "reductionNotes": reduction_notes,
    }
