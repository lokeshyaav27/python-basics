"""
Common Mathematical Calculations for Loan Eligibility & Credit Underwriting
"""
import math
from typing import Tuple, Dict, Any
from dsa_common.constants import (
    FOIR_BENCHMARK_NORMAL,
    FOIR_TIER_1_MAX,
    FOIR_TIER_2_MAX,
    FOIR_MAX_CEILING,
    FOIR_MULTIPLIER_NORMAL,
    FOIR_MULTIPLIER_TIER_1,
    FOIR_MULTIPLIER_TIER_2,
    FOIR_MULTIPLIER_TIER_3,
    FOIR_MULTIPLIER_REJECT,
)


def calculate_monthly_emi(loan_amount: float, annual_interest_rate_pct: float, tenure_years: int) -> float:
    """
    Standard Equated Monthly Installment (EMI) Formula:
    EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
    """
    if loan_amount <= 0 or tenure_years <= 0:
        return 0.0

    monthly_rate = (annual_interest_rate_pct / 12.0) / 100.0
    total_months = tenure_years * 12

    if monthly_rate == 0:
        return round(loan_amount / total_months, 2)

    numerator = loan_amount * monthly_rate * math.pow(1 + monthly_rate, total_months)
    denominator = math.pow(1 + monthly_rate, total_months) - 1

    if denominator == 0:
        return 0.0

    emi = numerator / denominator
    return round(emi, 2)


def calculate_max_loan_from_emi(max_allowable_emi: float, annual_interest_rate_pct: float, tenure_years: int) -> float:
    """
    Inverse EMI Formula to calculate maximum permissible loan amount from affordable monthly EMI:
    P = [EMI x ((1+R)^N - 1)] / [R x (1+R)^N]
    """
    if max_allowable_emi <= 0 or tenure_years <= 0:
        return 0.0

    monthly_rate = (annual_interest_rate_pct / 12.0) / 100.0
    total_months = tenure_years * 12

    if monthly_rate == 0:
        return round(max_allowable_emi * total_months, 2)

    numerator = max_allowable_emi * (math.pow(1 + monthly_rate, total_months) - 1)
    denominator = monthly_rate * math.pow(1 + monthly_rate, total_months)

    if denominator == 0:
        return 0.0

    principal = numerator / denominator
    return round(principal, 2)


def calculate_foir(existing_emi: float, monthly_obligation: float, proposed_emi: float, gross_monthly_income: float) -> float:
    """
    FOIR (Fixed Obligation to Income Ratio) Formula:
    FOIR (%) = [(Existing EMIs + Monthly Obligations + Proposed EMI) / Gross Monthly Income] * 100
    """
    if gross_monthly_income <= 0:
        return 100.0

    total_debt = (existing_emi or 0.0) + (monthly_obligation or 0.0) + (proposed_emi or 0.0)
    foir = (total_debt / gross_monthly_income) * 100.0
    return round(foir, 2)


def get_foir_reduction_multiplier(foir_percentage: float) -> Tuple[float, str]:
    """
    Returns the eligibility reduction multiplier and explanation based on calculated FOIR:
    - FOIR <= 50%: 1.0 (100% full eligibility)
    - 50% < FOIR <= 55%: 0.90 (10% reduction)
    - 55% < FOIR <= 60%: 0.80 (20% reduction)
    - 60% < FOIR <= 65%: 0.70 (30% reduction)
    - FOIR > 65%: 0.0 (Rejected / Not Eligible)
    """
    if foir_percentage <= FOIR_BENCHMARK_NORMAL:
        return FOIR_MULTIPLIER_NORMAL, "FOIR is within standard 50% benchmark."
    elif foir_percentage <= FOIR_TIER_1_MAX:
        return FOIR_MULTIPLIER_TIER_1, f"FOIR ({foir_percentage:.1f}%) is in Tier 1 (50-55%). 10% eligibility reduction applied."
    elif foir_percentage <= FOIR_TIER_2_MAX:
        return FOIR_MULTIPLIER_TIER_2, f"FOIR ({foir_percentage:.1f}%) is in Tier 2 (55-60%). 20% eligibility reduction applied."
    elif foir_percentage <= FOIR_MAX_CEILING:
        return FOIR_MULTIPLIER_TIER_3, f"FOIR ({foir_percentage:.1f}%) is in Tier 3 (60-65%). 30% eligibility reduction applied."
    else:
        return FOIR_MULTIPLIER_REJECT, f"FOIR ({foir_percentage:.1f}%) exceeds maximum permissible ceiling of {FOIR_MAX_CEILING:.0f}%."
