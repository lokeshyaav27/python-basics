"""
Personal Loan Eligibility Evaluation Service
Implements rules from DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List
from app.core.constants import (
    PERSONAL_LOAN_MAX_TENURE_YEARS,
    PERSONAL_LOAN_PRODUCT_MAX_CAP,
    PERSONAL_LOAN_ROI_TIER_1,
    PERSONAL_LOAN_ROI_TIER_2,
    PERSONAL_LOAN_ROI_TIER_3,
    PERSONAL_LOAN_ROI_TIER_4,
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


def get_personal_loan_interest_rate(cibil_score: int) -> float:
    """
    Determines Personal Loan interest rate by CIBIL tier:
    - >= 750: Tier 1
    - 700 - 749: Tier 2
    - 650 - 699: Tier 3
    - < 650: Tier 4
    """
    if cibil_score is None or cibil_score >= CIBIL_TIER_EXCELLENT:
        return PERSONAL_LOAN_ROI_TIER_1
    elif cibil_score >= CIBIL_TIER_GOOD:
        return PERSONAL_LOAN_ROI_TIER_2
    elif cibil_score >= CIBIL_TIER_FAIR:
        return PERSONAL_LOAN_ROI_TIER_3
    else:
        return PERSONAL_LOAN_ROI_TIER_4


def evaluate_personal_loan_eligibility(
    applicant_data: Dict[str, Any],
    personal_detail_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluates complete Personal Loan eligibility per DSA guidelines.
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
    
    # Priority for requested amount: personal_detail required_amount or general loan_amount_required
    req_from_detail = float(personal_detail_data.get("required_amount") or 0.0)
    req_from_app = float(applicant_data.get("loan_amount_required") or 0.0)
    requested_amount = req_from_detail if req_from_detail > 0 else req_from_app

    preferred_tenure = int(applicant_data.get("preferred_tenure") or 0)
    loan_purpose = personal_detail_data.get("loan_purpose") or "General Financial Requirement"

    # 1. Common Baseline Validation
    is_valid_common, common_rejections = validate_common_eligibility_checks(age, cibil_score, monthly_income)
    rejections.extend(common_rejections)

    # 2. Tenure Calculation (Max allowed years for Personal Loans)
    tenure_years = min(PERSONAL_LOAN_MAX_TENURE_YEARS, preferred_tenure if preferred_tenure > 0 else PERSONAL_LOAN_MAX_TENURE_YEARS)
    positive_factors.append(f"Applicable loan tenure: {tenure_years} years (max {PERSONAL_LOAN_MAX_TENURE_YEARS} years allowed).")

    # 3. Interest Rate Determination
    roi = get_personal_loan_interest_rate(cibil_score)
    positive_factors.append(f"Interest rate: {roi}% per annum based on CIBIL tier ({cibil_score}).")

    # 4. Proposed EMI & FOIR Evaluation for Requested Amount
    proposed_emi = calculate_monthly_emi(requested_amount, roi, tenure_years)
    calculated_foir = calculate_foir(existing_emi, monthly_obligation, proposed_emi, monthly_income)

    # 5. FOIR Assessment & Multiplier
    foir_multiplier, foir_msg = get_foir_reduction_multiplier(calculated_foir)

    if calculated_foir > FOIR_MAX_CEILING:
        rejections.append(f"Fixed Obligation to Income Ratio (FOIR) is {calculated_foir:.1f}%, exceeding the maximum {FOIR_MAX_CEILING:.0f}% ceiling.")
    elif calculated_foir > FOIR_BENCHMARK_NORMAL:
        reduction_notes.append(f"{foir_msg}. Proposed obligations consume {calculated_foir:.1f}% of gross income.")
    else:
        positive_factors.append(f"Healthy FOIR of {calculated_foir:.1f}% (within normal <= {FOIR_BENCHMARK_NORMAL:.0f}% limit).")

    # 6. Maximum FOIR-Supported Loan Calculation
    max_available_emi_for_proposed = max(0.0, (monthly_income * FOIR_INCOME_ALLOCATION_PCT) - existing_emi - monthly_obligation)
    foir_max_unscaled_loan = calculate_max_loan_from_emi(max_available_emi_for_proposed, roi, tenure_years)
    
    # Scale with FOIR multiplier if in the 50-65% bracket
    foir_eligible_amount = foir_max_unscaled_loan * foir_multiplier if foir_multiplier > 0 else 0.0

    # 7. Product Max Cap Limit
    product_max_cap = PERSONAL_LOAN_PRODUCT_MAX_CAP
    max_eligible_amount = min(foir_eligible_amount, product_max_cap)

    if requested_amount > product_max_cap:
        reduction_notes.append(f"Requested amount exceeds product cap of ₹{product_max_cap:,.0f}.")

    # 8. Final Decision Determination
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
            f"Eligible for a maximum of ₹{final_eligible_amount:,.0f} (instead of requested ₹{requested_amount:,.0f}) based on permissible debt service."
        )

    return {
        "productType": "Personal Loan",
        "status": status,
        "loanPurpose": loan_purpose,
        "requestedAmount": requested_amount,
        "eligibleAmount": final_eligible_amount,
        "proposedEmi": final_emi,
        "interestRatePct": roi,
        "tenureYears": tenure_years,
        "foirPct": calculated_foir,
        "maxAllowedFoirPct": FOIR_MAX_CEILING,
        "monthlyIncome": monthly_income,
        "existingEmi": existing_emi,
        "monthlyObligation": monthly_obligation,
        "cibilScore": cibil_score,
        "rejections": rejections,
        "positiveFactors": positive_factors,
        "reductionNotes": reduction_notes,
    }
