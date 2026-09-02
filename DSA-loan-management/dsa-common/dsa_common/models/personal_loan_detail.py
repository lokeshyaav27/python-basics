from sqlalchemy import Column, Integer, String, Numeric, Text
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class PersonalLoanDetail(Base):
    __tablename__ = "personal_loan_details"

    id = Column(Integer, primary_key=True, index=True)
    loan_amount_required = Column(Numeric(12, 2), nullable=True)
    preferred_tenure = Column(Integer, nullable=True)
    loan_purpose = Column(String(255), nullable=True)
    required_amount = Column(Numeric(12, 2), nullable=True)
    existing_obligations = Column(Numeric(12, 2), nullable=True)

    loan_applications = relationship("LoanApplication", back_populates="personalLoanDetail")
