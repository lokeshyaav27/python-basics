from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    mobile = Column(String(32), nullable=False)
    uniqueCustomerId = Column("unique_customer_id", String(32), nullable=False)

    agentId = Column("agent_id", Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    bankId = Column("bank_id", Integer, ForeignKey("banks.id", ondelete="SET NULL"), nullable=True)
    productId = Column("product_id", Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    homeLoanDetailId = Column("home_loan_detail_id", Integer, ForeignKey("home_loan_details.id", ondelete="SET NULL"), nullable=True)
    carLoanDetailId = Column("car_loan_detail_id", Integer, ForeignKey("car_loan_details.id", ondelete="SET NULL"), nullable=True)
    personalLoanDetailId = Column("personal_loan_detail_id", Integer, ForeignKey("personal_loan_details.id", ondelete="SET NULL"), nullable=True)
    clientGeneralDetailTableId = Column("client_general_detail_id", Integer, ForeignKey("client_general_details.id", ondelete="SET NULL"), nullable=True)

    status = Column(String(32), nullable=True, default=None)
    description = Column(Text, nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)

    # Relationships
    agent = relationship("Agent", backref="loan_applications")
    bank = relationship("Bank", backref="loan_applications")
    product = relationship("Product", backref="loan_applications")
    homeLoanDetail = relationship("HomeLoanDetail", backref="loan_applications")
    carLoanDetail = relationship("CarLoanDetail", backref="loan_applications")
    personalLoanDetail = relationship("PersonalLoanDetail", backref="loan_applications")
    clientGeneralDetail = relationship("ClientGeneralDetail", backref="loan_applications")
