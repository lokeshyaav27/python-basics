"""
Common Financial Math & Validation Utilities for DSA Loan Eligibility
Based on DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List, Tuple
from app.core.constants import (
    MIN_APPLICANT_AGE,
    MAX_APPLICANT_AGE,
    MIN_CIBIL_SCORE,
    MIN_GROSS_MONTHLY_INCOME,
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


def calculate_monthly_emi(principal: float, annual_interest_rate_pct: float, tenure_years: int) -> float:
    """
    Calculates the standard monthly equated installment (EMI).
    Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
    """
    if principal <= 0 or tenure_years <= 0:
        return 0.0
    
    if annual_interest_rate_pct <= 0:
        return round(principal / (tenure_years * 12), 2)

    monthly_rate = (annual_interest_rate_pct / 100.0) / 12.0
    num_months = int(tenure_years * 12)

    try:
        factor = (1.0 + monthly_rate) ** num_months
        emi = principal * monthly_rate * factor / (factor - 1.0)
        return round(emi, 2)
    except OverflowError:
        return 0.0


def calculate_max_loan_from_emi(max_monthly_emi: float, annual_interest_rate_pct: float, tenure_years: int) -> float:
    """
    Inverts the EMI formula to compute the maximum principal loan amount
    sustainable by a given monthly EMI capacity.
    Formula: P = EMI * ((1 + r)^n - 1) / (r * (1 + r)^n)
    """
    if max_monthly_emi <= 0 or tenure_years <= 0:
        return 0.0

    if annual_interest_rate_pct <= 0:
        return round(max_monthly_emi * (tenure_years * 12), 2)

    monthly_rate = (annual_interest_rate_pct / 100.0) / 12.0
    num_months = int(tenure_years * 12)

    try:
        factor = (1.0 + monthly_rate) ** num_months
        principal = (max_monthly_emi * (factor - 1.0)) / (monthly_rate * factor)
        return round(max(0.0, principal), 2)
    except (OverflowError, ZeroDivisionError):
        return 0.0


def calculate_foir(existing_emi: float, monthly_obligations: float, proposed_emi: float, gross_monthly_income: float) -> float:
    """
    FOIR = (Total Monthly Debt Payments / Gross Monthly Income) * 100
    Total Monthly Debt Payments = Existing EMI + Existing Monthly Obligations + Proposed Loan EMI
    """
    if gross_monthly_income <= 0:
        return 100.0

    total_debt = float(existing_emi or 0.0) + float(monthly_obligations or 0.0) + float(proposed_emi or 0.0)
    foir = (total_debt / float(gross_monthly_income)) * 100.0
    return round(foir, 2)


def get_foir_reduction_multiplier(foir: float) -> Tuple[float, str]:
    """
    Evaluates FOIR reduction tiers against centralized policy constants.
    """
    if foir <= FOIR_BENCHMARK_NORMAL:
        return FOIR_MULTIPLIER_NORMAL, f"Normal FOIR (<= {FOIR_BENCHMARK_NORMAL:.0f}%)"
    elif foir <= FOIR_TIER_1_MAX:
        return FOIR_MULTIPLIER_TIER_1, f"FOIR is between {FOIR_BENCHMARK_NORMAL:.0f}%–{FOIR_TIER_1_MAX:.0f}% (10% reduction applied)"
    elif foir <= FOIR_TIER_2_MAX:
        return FOIR_MULTIPLIER_TIER_2, f"FOIR is between {FOIR_TIER_1_MAX+1:.0f}%–{FOIR_TIER_2_MAX:.0f}% (20% reduction applied)"
    elif foir <= FOIR_MAX_CEILING:
        return FOIR_MULTIPLIER_TIER_3, f"FOIR is between {FOIR_TIER_2_MAX+1:.0f}%–{FOIR_MAX_CEILING:.0f}% (30% reduction applied)"
    else:
        return FOIR_MULTIPLIER_REJECT, f"FOIR exceeds maximum threshold of {FOIR_MAX_CEILING:.0f}% (Rejection)"


def validate_common_eligibility_checks(
    age: int,
    cibil_score: int,
    monthly_income: float,
) -> Tuple[bool, List[str]]:
    """
    Executes standard common baseline rules:
    - Minimum CIBIL score
    - Minimum and maximum applicant age
    - Minimum monthly income
    """
    rejections: List[str] = []

    if cibil_score is not None and cibil_score < MIN_CIBIL_SCORE:
        rejections.append(f"CIBIL score ({cibil_score}) is below minimum required score of {MIN_CIBIL_SCORE}.")

    if age is not None:
        if age < MIN_APPLICANT_AGE:
            rejections.append(f"Applicant age ({age} yrs) is below legal minimum age of {MIN_APPLICANT_AGE}.")
        elif age > MAX_APPLICANT_AGE:
            rejections.append(f"Applicant age ({age} yrs) exceeds maximum permissible age of {MAX_APPLICANT_AGE}.")

    if monthly_income is not None and monthly_income < MIN_GROSS_MONTHLY_INCOME:
        rejections.append(f"Monthly gross income (₹{monthly_income:,.0f}) is below the minimum required threshold of ₹{MIN_GROSS_MONTHLY_INCOME:,.0f}.")

    return len(rejections) == 0, rejections

