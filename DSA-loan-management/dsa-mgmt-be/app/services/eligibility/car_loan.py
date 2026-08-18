"""
Car Loan Eligibility Evaluation Service
Implements rules from DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List
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
    - >= 750: 8.75%
    - 700 - 749: 9.50%
    - 650 - 699: 10.50%
    - 600 - 649: 11.50%
    """
    if cibil_score is None or cibil_score >= 750:
        return 8.75
    elif cibil_score >= 700:
        return 9.50
    elif cibil_score >= 650:
        return 10.50
    else:
        return 11.50


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
    age = applicant_data.get("age") or 30
    cibil_score = applicant_data.get("cibil_score") or 750
    monthly_income = float(applicant_data.get("monthly_income") or 0.0)
    existing_emi = float(applicant_data.get("existing_emi") or 0.0)
    monthly_obligation = float(applicant_data.get("monthly_obligation") or 0.0)
    requested_amount = float(applicant_data.get("loan_amount_required") or 0.0)
    preferred_tenure = applicant_data.get("preferred_tenure") or 5

    # Extract Car Detail fields
    new_or_used = str(car_detail_data.get("new_or_used") or "new").lower()
    is_used = "used" in new_or_used or "old" in new_or_used
    car_value = float(car_detail_data.get("car_value") or 0.0)
    vehicle_age = int(car_detail_data.get("vehicle_age") or 0)
    down_payment = float(car_detail_data.get("down_payment") or 0.0)

    # 1. Common Baseline Validation
    is_valid_common, common_rejections = validate_common_eligibility_checks(age, cibil_score, monthly_income)
    rejections.extend(common_rejections)

    # 2. Used Vehicle Age Check (Reject if > 15 years)
    if is_used and vehicle_age > 15:
        rejections.append(f"Used vehicle age ({vehicle_age} years) exceeds the maximum permissible limit of 15 years.")
    elif is_used:
        positive_factors.append(f"Used vehicle age ({vehicle_age} years) satisfies age criteria (<= 15 years).")
    else:
        positive_factors.append("New car loan application eligible for up to 100% on-road funding.")

    # 3. Vehicle Valuation / LTV Cap
    # New Car -> 100% of car value
    # Used Car -> 50% of car value
    if is_used:
        max_ltv_pct = 50.0
        vehicle_cap = car_value * 0.50 if car_value > 0 else 0.0
        reduction_notes.append("Used vehicle financing is capped at a maximum 50% of appraised car value.")
    else:
        max_ltv_pct = 100.0
        vehicle_cap = car_value if car_value > 0 else 0.0

    # 4. Tenure Calculation (Max 5 years for Car Loans)
    tenure_years = min(5, preferred_tenure if preferred_tenure and preferred_tenure > 0 else 5)
    positive_factors.append(f"Applicable loan tenure: {tenure_years} years (max 5 years allowed).")

    # 5. Interest Rate Determination
    roi = get_car_loan_interest_rate(cibil_score)
    positive_factors.append(f"Interest rate: {roi}% per annum based on CIBIL tier ({cibil_score}).")

    # 6. Proposed EMI & FOIR Evaluation for Requested Amount
    proposed_emi = calculate_monthly_emi(requested_amount, roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    # 7. FOIR Assessment & Multiplier
    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)

    if calculated_foir > 65.0:
        rejections.append(f"Fixed Obligation to Income Ratio (FOIR) is {calculated_foir:.1f}%, exceeding the maximum 65% ceiling.")
    elif calculated_foir > 50.0:
        reduction_notes.append(f"{foir_msg}. Proposed obligations consume {calculated_foir:.1f}% of gross income.")
    else:
        positive_factors.append(f"Healthy FOIR of {calculated_foir:.1f}% (within normal <= 50% limit).")

    # 8. Maximum FOIR-Supported Loan Calculation
    max_available_emi_for_proposed = max(0.0, (monthly_income * 0.50) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi_for_proposed, roi, tenure_years)
    
    # Scale with FOIR multiplier if in the 50-65% bracket
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    # 9. Combined Max Eligible Calculation (MIN of FOIR-capacity and Vehicle Valuation Cap)
    if vehicle_cap > 0:
        max_eligible_amount = min(foir_eligible_amount, vehicle_cap)
        if vehicle_cap < foir_eligible_amount:
            reduction_notes.append(f"Loan amount is capped at ₹{vehicle_cap:,.0f} due to vehicle valuation limit ({max_ltv_pct}%).")
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
        "maxAllowedFoirPct": 65.0,
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
