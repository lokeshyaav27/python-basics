from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.agent import Agent
from app.models.bank import Bank
from app.models.product import Product
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail
from app.models.client_general_detail import ClientGeneralDetail


class LoanApplication(Base):
    __tablename__ = "loan_applications"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    mobile = Column(String(32), nullable=False)
    uniqueCustomerId = Column("uniquecustomerid", String(32), nullable=True)
    agentId = Column("agentid", Integer, ForeignKey("agents.id"), nullable=True)
    bankId = Column("bankid", Integer, ForeignKey("banks.id"), nullable=True)
    productId = Column("productid", Integer, ForeignKey("products.id"), nullable=True)
    homeLoanDetailId = Column("homeloandetailid", Integer, ForeignKey("home_loan_details.id"), nullable=True)
    carLoanDetailId = Column("carloandetailid", Integer, ForeignKey("car_loan_details.id"), nullable=True)
    personalLoanDetailId = Column("personalloandetailid", Integer, ForeignKey("personal_loan_details.id"), nullable=True)
    clientGeneralDetailTableId = Column("clientgeneraldetailstableid", Integer, ForeignKey("client_general_details.id"), nullable=True)
    status = Column(String(32), nullable=False, default="not-started")
    description = Column(Text, nullable=True)
    isActive = Column("isactive", Boolean, nullable=False, default=True)

    agent = relationship("Agent", backref="loan_applications")
    bank = relationship("Bank", backref="loan_applications")
    product = relationship("Product", backref="loan_applications")
    homeLoanDetail = relationship("HomeLoanDetail", backref="loan_applications")
    carLoanDetail = relationship("CarLoanDetail", backref="loan_applications")
    personalLoanDetail = relationship("PersonalLoanDetail", backref="loan_applications")
    clientGeneralDetail = relationship("ClientGeneralDetail", backref="loan_applications")


# Backward compatibility alias
Customer = LoanApplication
