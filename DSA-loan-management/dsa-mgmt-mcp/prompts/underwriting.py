def get_underwriting_review_prompt(application_id: int) -> str:
    """
    Standardized prompt template for credit underwriting review and borrower risk assessment.
    """
    return f"""You are a Senior DSA Credit Underwriting Specialist.
Review Loan Application #{application_id} and provide a comprehensive credit assessment:

1. Use `check_loan_eligibility(application_id={application_id})` to compute FOIR, LTV, and net disposable income.
2. Use `get_loan_dossier(application_id={application_id})` to inspect the borrower's income, CIBIL score, and collateral details.
3. If FOIR or LTV thresholds are breached, highlight mitigating factors (such as adding a co-applicant or increasing down payment).
4. Summarize your final underwriting recommendation with clear financial metrics.
"""
