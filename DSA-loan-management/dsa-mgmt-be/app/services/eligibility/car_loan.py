"""
Car Loan Eligibility Evaluation Service
Implements rules from DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List
from app.core.constants import (
    CAR_LOAN_MAX_TENURE_YEARS,
    CAR_LOAN_MAX_USED_VEHICLE_AGE_YEARS,
    CAR_LOAN_LTV_NEW,
    CAR_LOAN_LTV_USED,
    CAR_LOAN_ROI_TIER_1,
    CAR_LOAN_ROI_TIER_2,
    CAR_LOAN_ROI_TIER_3,
    CAR_LOAN_ROI_TIER_4,
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


def get_car_loan_interest_rate(cibil_score: int) -> float:
    """
    Determines Car Loan interest rate by CIBIL tier:
    - >= 750: Tier 1
    - 700 - 749: Tier 2
    - 650 - 699: Tier 3
    - < 650: Tier 4
    """
    if cibil_score is None or cibil_score >= CIBIL_TIER_EXCELLENT:
        return CAR_LOAN_ROI_TIER_1
    elif cibil_score >= CIBIL_TIER_GOOD:
        return CAR_LOAN_ROI_TIER_2
    elif cibil_score >= CIBIL_TIER_FAIR:
        return CAR_LOAN_ROI_TIER_3
    else:
        return CAR_LOAN_ROI_TIER_4


def evaluate_car_loan_eligibility(
    applicant_data: Dict[str, Any],
    car_detail_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluates complete Car Loan eligibility per DSA guidelines.
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

    # Extract Car Detail fields
    new_or_used = str(car_detail_data.get("new_or_used") or "new").lower()
    is_used = "used" in new_or_used or "old" in new_or_used
    car_value = float(car_detail_data.get("car_value") or 0.0)
    vehicle_age = int(car_detail_data.get("vehicle_age") or 0)
    down_payment = float(car_detail_data.get("down_payment") or 0.0)

    # 1. Common Baseline Validation
    is_valid_common, common_rejections = validate_common_eligibility_checks(age, cibil_score, monthly_income)
    rejections.extend(common_rejections)

    # 2. Used Vehicle Age Check
    if is_used and vehicle_age > CAR_LOAN_MAX_USED_VEHICLE_AGE_YEARS:
        rejections.append(f"Used vehicle age ({vehicle_age} years) exceeds the maximum permissible limit of {CAR_LOAN_MAX_USED_VEHICLE_AGE_YEARS} years.")
    elif is_used:
        positive_factors.append(f"Used vehicle age ({vehicle_age} years) satisfies age criteria (<= {CAR_LOAN_MAX_USED_VEHICLE_AGE_YEARS} years).")
    else:
        positive_factors.append(f"New car loan application eligible for up to {CAR_LOAN_LTV_NEW:.0f}% on-road funding.")

    # 3. Vehicle Valuation / LTV Cap
    if is_used:
        max_ltv_pct = CAR_LOAN_LTV_USED
        vehicle_cap = car_value * (CAR_LOAN_LTV_USED / 100.0) if car_value > 0 else 0.0
        reduction_notes.append(f"Used vehicle financing is capped at a maximum {CAR_LOAN_LTV_USED:.0f}% of appraised car value.")
    else:
        max_ltv_pct = CAR_LOAN_LTV_NEW
        vehicle_cap = car_value * (CAR_LOAN_LTV_NEW / 100.0) if car_value > 0 else 0.0

    # 4. Tenure Calculation (Max 5 years for Car Loans)
    tenure_years = min(CAR_LOAN_MAX_TENURE_YEARS, preferred_tenure if preferred_tenure > 0 else CAR_LOAN_MAX_TENURE_YEARS)
    positive_factors.append(f"Applicable loan tenure: {tenure_years} years (max {CAR_LOAN_MAX_TENURE_YEARS} years allowed).")

    # 5. Interest Rate Determination
    roi = get_car_loan_interest_rate(cibil_score)
    positive_factors.append(f"Interest rate: {roi}% per annum based on CIBIL tier ({cibil_score}).")

    # 6. Proposed EMI & FOIR Evaluation for Requested Amount
    proposed_emi = calculate_monthly_emi(requested_amount, roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    # 7. FOIR Assessment & Multiplier
    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)

    if calculated_foir > FOIR_MAX_CEILING:
        rejections.append(f"Fixed Obligation to Income Ratio (FOIR) is {calculated_foir:.1f}%, exceeding the maximum {FOIR_MAX_CEILING:.0f}% ceiling.")
    elif calculated_foir > FOIR_BENCHMARK_NORMAL:
        reduction_notes.append(f"{foir_msg}. Proposed obligations consume {calculated_foir:.1f}% of gross income.")
    else:
        positive_factors.append(f"Healthy FOIR of {calculated_foir:.1f}% (within normal <= {FOIR_BENCHMARK_NORMAL:.0f}% limit).")

    # 8. Maximum FOIR-Supported Loan Calculation
    max_available_emi_for_proposed = max(0.0, (monthly_income * FOIR_INCOME_ALLOCATION_PCT) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi_for_proposed, roi, tenure_years)
    
    # Scale with FOIR multiplier if in the 50-65% bracket
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    # 9. Combined Max Eligible Calculation (MIN of FOIR-capacity and Vehicle Valuation Cap)
    if vehicle_cap > 0:
        max_eligible_amount = min(foir_eligible_amount, vehicle_cap)
        if vehicle_cap < foir_eligible_amount:
            reduction_notes.append(f"Loan amount is capped at ₹{vehicle_cap:,.0f} due to vehicle valuation limit ({max_ltv_pct:.0f}%).")
    else:
        max_eligible_amount = foir_eligible_amount

    # 10. Final Decision Determination
    actual_ltv = round((requested_amount / car_value) * 100.0, 1) if car_value > 0 else 0.0

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
        final_emi = calculate_monthly_emi(final_eligible_amount, roi, tenure_years)
        reduction_notes.append(
            f"Eligible for a maximum of ₹{final_eligible_amount:,.0f} (instead of requested ₹{requested_amount:,.0f}) based on valuation & debt service."
        )

    return {
        "productType": "Car Loan",
        "status": status,
        "isUsedCar": is_used,
        "vehicleAge": vehicle_age,
        "carValue": car_value,
        "downPayment": down_payment,
        "requestedAmount": requested_amount,
        "eligibleAmount": final_eligible_amount,
        "proposedEmi": final_emi,
        "interestRatePct": roi,
        "tenureYears": tenure_years,
        "foirPct": calculated_foir,
        "maxAllowedFoirPct": FOIR_MAX_CEILING,
        "ltvPct": actual_ltv,
        "maxAllowedLtvPct": max_ltv_pct,
        "monthlyIncome": monthly_income,
        "existingEmi": existing_emi,
        "monthlyObligation": monthly_obligation,
        "cibilScore": cibil_score,
        "rejections": rejections,
        "positiveFactors": positive_factors,
        "reductionNotes": reduction_notes,
    }
