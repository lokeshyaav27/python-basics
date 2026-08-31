"""
Domain Constants for Loan Eligibility Underwriting and Bank Comparison Engines.
Centralizes policy benchmarks, thresholds, rate tiers, LTV limits, and tenure rules.
"""

# ==============================================================================
# 1. COMMON UNDERWRITING BASELINE CONSTANTS
# ==============================================================================
MIN_APPLICANT_AGE: int = 18
MAX_APPLICANT_AGE: int = 60

MIN_CIBIL_SCORE: int = 600
CIBIL_TIER_EXCELLENT: int = 750
CIBIL_TIER_GOOD: int = 700
CIBIL_TIER_FAIR: int = 650

MIN_GROSS_MONTHLY_INCOME: float = 15000.0

# FOIR (Fixed Obligation to Income Ratio) Benchmarks (%)
FOIR_BENCHMARK_NORMAL: float = 50.0
FOIR_TIER_1_MAX: float = 55.0
FOIR_TIER_2_MAX: float = 60.0
FOIR_MAX_CEILING: float = 65.0

# FOIR Eligibility Multipliers
FOIR_MULTIPLIER_NORMAL: float = 1.0
FOIR_MULTIPLIER_TIER_1: float = 0.90
FOIR_MULTIPLIER_TIER_2: float = 0.80
FOIR_MULTIPLIER_TIER_3: float = 0.70
FOIR_MULTIPLIER_REJECT: float = 0.0

FOIR_INCOME_ALLOCATION_PCT: float = 0.50


# ==============================================================================
# 2. HOME LOAN POLICY CONSTANTS
# ==============================================================================
HOME_LOAN_MAX_TENURE_YEARS: int = 30
HOME_LOAN_MAX_MATURITY_AGE: int = 60
HOME_LOAN_FEMALE_CO_APPLICANT_REBATE: float = 0.50
HOME_LOAN_FEMALE_FEE_CONCESSION_PCT: float = 0.0
HOME_LOAN_MIN_ROI_FLOOR: float = 6.0

# Home Loan LTV Caps (%)
HOME_LOAN_LTV_FLAT_APARTMENT: float = 60.0
HOME_LOAN_LTV_STANDARD: float = 70.0
HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION: float = 80.0

# Home Loan ROI Tiers by CIBIL (% p.a.)
HOME_LOAN_ROI_TIER_1: float = 8.50   # CIBIL >= 750
HOME_LOAN_ROI_TIER_2: float = 9.00   # 700 <= CIBIL < 750
HOME_LOAN_ROI_TIER_3: float = 9.75   # 650 <= CIBIL < 700
HOME_LOAN_ROI_TIER_4: float = 10.50  # CIBIL < 650


# ==============================================================================
# 3. CAR LOAN POLICY CONSTANTS
# ==============================================================================
CAR_LOAN_MAX_TENURE_YEARS: int = 5
CAR_LOAN_MAX_USED_VEHICLE_AGE_YEARS: int = 15

# Car Loan LTV Caps (%)
CAR_LOAN_LTV_NEW: float = 100.0
CAR_LOAN_LTV_USED: float = 50.0

# Car Loan ROI Tiers by CIBIL (% p.a.)
CAR_LOAN_ROI_TIER_1: float = 8.75   # CIBIL >= 750
CAR_LOAN_ROI_TIER_2: float = 9.50   # 700 <= CIBIL < 750
CAR_LOAN_ROI_TIER_3: float = 10.50  # 650 <= CIBIL < 700
CAR_LOAN_ROI_TIER_4: float = 11.50  # CIBIL < 650


# ==============================================================================
# 4. PERSONAL LOAN POLICY CONSTANTS
# ==============================================================================
PERSONAL_LOAN_MAX_TENURE_YEARS: int = 5
PERSONAL_LOAN_PRODUCT_MAX_CAP: float = 2500000.0

# Personal Loan ROI Tiers by CIBIL (% p.a.)
PERSONAL_LOAN_ROI_TIER_1: float = 10.50  # CIBIL >= 750
PERSONAL_LOAN_ROI_TIER_2: float = 11.50  # 700 <= CIBIL < 750
PERSONAL_LOAN_ROI_TIER_3: float = 13.00  # 650 <= CIBIL < 700
PERSONAL_LOAN_ROI_TIER_4: float = 14.50  # CIBIL < 650


# ==============================================================================
# 5. BANK COMPARISON POLICY CONSTANTS
# ==============================================================================
MAX_BANKS_COMPARISON_LIMIT: int = 2

BANK_MATURITY_AGE_PRIVATE: int = 60
BANK_MATURITY_AGE_PUBLIC_NBFC: int = 65

BANK_COMPARISON_FEMALE_REBATE_PCT: float = 0.05
BANK_COMPARISON_MIN_ROI_FLOOR: float = 6.50

BANK_DEFAULT_PROCESSING_FEE_PCT: float = 0.50
BANK_DEFAULT_INSURANCE_PREMIUM_PCT: float = 1.00
BANK_DEFAULT_DSA_COMMISSION_PCT: float = 0.60
