from sqlalchemy import Column, Integer, String, Numeric, Boolean
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class HomeLoanDetail(Base):
    __tablename__ = "home_loan_details"

    id = Column(Integer, primary_key=True, index=True)
    loan_amount_required = Column(Numeric(12, 2), nullable=True)
    preferred_tenure = Column(Integer, nullable=True)
    property_value = Column(Numeric(12, 2), nullable=True)
    property_location = Column(String(255), nullable=True)
    propertyUsageType = Column(String(64), nullable=True)
    down_payment = Column(Numeric(12, 2), nullable=True)
    isPartProperty = Column(Boolean, nullable=False, default=False)
    propertyRequirement = Column(String(64), nullable=True)
    propertyType = Column(String(64), nullable=True)
    propertyStatus = Column(String(64), nullable=True)
    femaleCoApplicant = Column(Boolean, nullable=False, default=False)
    propertyInsurance = Column(Boolean, nullable=False, default=True)
    applicantInsurance = Column(Boolean, nullable=False, default=True)

    loan_applications = relationship("LoanApplication", back_populates="homeLoanDetail")
