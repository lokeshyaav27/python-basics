from app.models.base import Base
from app.models.product import Product
from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.models.agent import Agent
from app.models.client_general_detail import ClientGeneralDetail
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail
from app.models.loan_application import LoanApplication
from app.models.contact_enquiry import ContactEnquiry

__all__ = [
    "Base",
    "Product",
    "Bank",
    "ProductBankLink",
    "BankDocument",
    "Agent",
    "ClientGeneralDetail",
    "HomeLoanDetail",
    "CarLoanDetail",
    "PersonalLoanDetail",
    "LoanApplication",
    "ContactEnquiry",
]
