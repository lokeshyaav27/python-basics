"""
DSA Services Package
Uses lazy module exports to allow sub-packages (e.g. eligibility, comparison)
to be imported without triggering unnecessary top-level dependency loading.
"""

__all__ = [
    "ProductService",
    "BankService",
    "AgentService",
    "AuthService",
    "LoanApplicationService",
    "ContactService",
    "EligibilityService",
    "ComparisonService",
]


def __getattr__(name: str):
    if name == "ProductService":
        from app.services.product_service import ProductService
        return ProductService
    elif name == "BankService":
        from app.services.bank_service import BankService
        return BankService
    elif name == "AgentService":
        from app.services.agent_service import AgentService
        return AgentService
    elif name == "AuthService":
        from app.services.auth_service import AuthService
        return AuthService
    elif name == "LoanApplicationService":
        from app.services.loan_application_service import LoanApplicationService
        return LoanApplicationService
    elif name == "ContactService":
        from app.services.contact_service import ContactService
        return ContactService
    elif name == "EligibilityService":
        from app.services.eligibility_service import EligibilityService
        return EligibilityService
    elif name == "ComparisonService":
        from app.services.comparison_service import ComparisonService
        return ComparisonService
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
