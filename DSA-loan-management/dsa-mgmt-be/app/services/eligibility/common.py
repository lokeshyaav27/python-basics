"""
Common Financial Math & Validation Utilities for DSA Loan Eligibility
Based on DSA_Loan_Eligibility_Rules.md
"""
from typing import Dict, Any, List, Tuple


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
    FOIR Rules:
    - If FOIR is 50% or below -> normal eligibility (1.0 multiplier, 0% reduction)
    - If FOIR is between 50 to 55% -> 10% reduction (0.90 multiplier)
    - If FOIR is between 56 to 60% -> 20% reduction (0.80 multiplier)
    - If FOIR is between 61 to 65% -> 30% reduction (0.70 multiplier)
    - If FOIR is above 65% -> 0.0 multiplier (reject application)
    """
    if foir <= 50.0:
        return 1.0, "Normal FOIR (<= 50%)"
    elif foir <= 55.0:
        return 0.90, "FOIR is between 50%–55% (10% reduction applied)"
    elif foir <= 60.0:
        return 0.80, "FOIR is between 56%–60% (20% reduction applied)"
    elif foir <= 65.0:
        return 0.70, "FOIR is between 61%–65% (30% reduction applied)"
    else:
        return 0.0, "FOIR exceeds maximum threshold of 65% (Rejection)"


def validate_common_eligibility_checks(
    age: int,
    cibil_score: int,
    monthly_income: float,
) -> Tuple[bool, List[str]]:
    """
    Executes standard common baseline rules:
    - Minimum CIBIL score: reject if below 600
    - Minimum applicant age: reject if below 18
    - Maximum applicant age: reject if above 60
    - Minimum income: reject if less than 15,000
    """
    rejections: List[str] = []

    if cibil_score is not None and cibil_score < 600:
        rejections.append(f"CIBIL score ({cibil_score}) is below minimum required score of 600.")

    if age is not None:
        if age < 18:
            rejections.append(f"Applicant age ({age} yrs) is below legal minimum age of 18.")
        elif age > 60:
            rejections.append(f"Applicant age ({age} yrs) exceeds maximum permissible age of 60.")

    if monthly_income is not None and monthly_income < 15000:
        rejections.append(f"Monthly gross income (₹{monthly_income:,.0f}) is below the minimum required threshold of ₹15,000.")

    return len(rejections) == 0, rejections
