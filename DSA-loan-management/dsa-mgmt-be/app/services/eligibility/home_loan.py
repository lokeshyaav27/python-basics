"""
Home Loan Eligibility Evaluation Service
Implements rules from DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List, Tuple
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
    - >= 750: 8.50%
    - 700 - 749: 9.00%
    - 650 - 699: 9.75%
    - 600 - 649: 10.50%
    Female Co-applicant gives a 0.50% interest rate rebate.
    """
    if cibil_score is None or cibil_score >= 750:
        base_rate = 8.50
    elif cibil_score >= 700:
        base_rate = 9.00
    elif cibil_score >= 650:
        base_rate = 9.75
    else:
        base_rate = 10.50

    rebate = 0.50 if female_co_applicant else 0.0
    effective_rate = max(6.0, base_rate - rebate)
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
    age = applicant_data.get("age") or 30
    cibil_score = applicant_data.get("cibil_score") or 750
    monthly_income = float(applicant_data.get("monthly_income") or 0.0)
    existing_emi = float(applicant_data.get("existing_emi") or 0.0)
    monthly_obligation = float(applicant_data.get("monthly_obligation") or 0.0)
    requested_amount = float(applicant_data.get("loan_amount_required") or 0.0)
    preferred_tenure = applicant_data.get("preferred_tenure") or 20

    # Extract Home Detail fields
    property_value = float(home_detail_data.get("property_value") or 0.0)
    property_type = str(home_detail_data.get("propertyType") or "").lower()
    property_status = str(home_detail_data.get("propertyStatus") or "").lower()
    female_co_applicant = bool(home_detail_data.get("femaleCoApplicant", False))

    # 1. Common Baseline Validation
    is_valid_common, common_rejections = validate_common_eligibility_checks(age, cibil_score, monthly_income)
    rejections.extend(common_rejections)

    # 2. Tenure Calculation (Loan must mature before age 60; product max 30 yrs)
    max_age_tenure = max(1, 60 - age)
    tenure_years = min(30, max_age_tenure, preferred_tenure if preferred_tenure else 20)
    if tenure_years < 1:
        rejections.append(f"Age {age} leaves insufficient time before maximum age limit (60 years) to service a loan.")
    else:
        positive_factors.append(f"Applicable loan tenure: {tenure_years} years (matures before age 60).")

    # 3. Interest Rate Determination
    effective_roi, base_roi, rebate = get_home_loan_interest_rate(cibil_score, female_co_applicant)
    if female_co_applicant:
        positive_factors.append(f"Special 0.50% female co-applicant concession applied (ROI: {effective_roi}% vs base {base_roi}%).")
    else:
        positive_factors.append(f"Interest rate: {effective_roi}% per annum based on CIBIL tier ({cibil_score}).")

    # 4. Property LTV Cap Evaluation
    # Flat -> max 60%
    # Under-construction / Ready-to-move -> max 80%
    # General -> max 70%
    if "flat" in property_type or "apartment" in property_type:
        max_ltv_pct = 60.0
        ltv_desc = "Flat/Apartment category (Max 60% LTV)"
    elif "under" in property_status or "ready" in property_status:
        max_ltv_pct = 80.0
        ltv_desc = "Ready-to-move / Under-construction property (Max 80% LTV)"
    else:
        max_ltv_pct = 70.0
        ltv_desc = "Standard property valuation (Max 70% LTV)"

    ltv_cap_amount = (property_value * max_ltv_pct / 100.0) if property_value > 0 else 0.0

    # 5. Proposed EMI & FOIR Evaluation for Requested Amount
    proposed_emi = calculate_monthly_emi(requested_amount, effective_roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    # 6. FOIR Assessment & Multiplier
    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)

    if calculated_foir > 65.0:
        rejections.append(f"Fixed Obligation to Income Ratio (FOIR) is {calculated_foir:.1f}%, exceeding the maximum 65% ceiling.")
    elif calculated_foir > 50.0:
        reduction_notes.append(f"{foir_msg}. Proposed obligations consume {calculated_foir:.1f}% of gross income.")
    else:
        positive_factors.append(f"Healthy FOIR of {calculated_foir:.1f}% (within normal <= 50% limit).")

    # 7. Maximum FOIR-Supported Loan Calculation
    # Normal permissible monthly EMI at 50% FOIR threshold:
    max_available_emi_for_proposed = max(0.0, (monthly_income * 0.50) - existing_emi - monthly_obligation)
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
