from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    mobile = Column(String(32), nullable=False)
    uniqueCustomerId = Column("unique_customer_id", String(64), nullable=True, index=True)
    productId = Column("product_id", Integer, ForeignKey("products.id"), nullable=False)
    agentId = Column("agent_id", Integer, ForeignKey("agents.id"), nullable=True)
    bankId = Column("bank_id", Integer, ForeignKey("banks.id"), nullable=True)
    status = Column(String(64), nullable=False, default="Lead Created")
    description = Column(Text, nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)
    createdAt = Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc))

    clientGeneralDetailId = Column("client_general_detail_id", Integer, ForeignKey("client_general_details.id"), nullable=True)
    homeLoanDetailId = Column("home_loan_detail_id", Integer, ForeignKey("home_loan_details.id"), nullable=True)
    carLoanDetailId = Column("car_loan_detail_id", Integer, ForeignKey("car_loan_details.id"), nullable=True)
    personalLoanDetailId = Column("personal_loan_detail_id", Integer, ForeignKey("personal_loan_details.id"), nullable=True)

    product = relationship("Product")
    agent = relationship("Agent", back_populates="applications")
    bank = relationship("Bank")

    clientGeneralDetail = relationship("ClientGeneralDetail", back_populates="loan_applications")
    homeLoanDetail = relationship("HomeLoanDetail", back_populates="loan_applications")
    carLoanDetail = relationship("CarLoanDetail", back_populates="loan_applications")
    personalLoanDetail = relationship("PersonalLoanDetail", back_populates="loan_applications")
