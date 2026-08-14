from sqlalchemy import Column, Integer, ForeignKey
from app.models.base import Base


class LoanTable(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    loanApplicationId = Column("loanapplicationid", Integer, ForeignKey("loan_applications.id"), nullable=False)
    clientGeneralDetailTableId = Column(Integer, ForeignKey("client_general_details.id"), nullable=True)
    homeLoanDetailId = Column(Integer, ForeignKey("home_loan_details.id"), nullable=True)
    carLoanDetailId = Column(Integer, ForeignKey("car_loan_details.id"), nullable=True)
    personalLoanDetailId = Column(Integer, ForeignKey("personal_loan_details.id"), nullable=True)
