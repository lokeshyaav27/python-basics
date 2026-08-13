from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey
from app.models.base import Base


class HomeLoanDetail(Base):
    __tablename__ = "home_loan_details"
    id = Column(Integer, primary_key=True, index=True)
    property_value = Column(Numeric(14, 2), nullable=True)
    property_location = Column(String(255), nullable=True)
    propertyUsageType = Column(String(64), nullable=True)
    down_payment = Column(Numeric(14, 2), nullable=True)
    isPartProperty = Column(Boolean, nullable=True)
    propertyRequirement = Column(String(128), nullable=True)
    propertyType = Column(String(64), nullable=True)
    propertyStatus = Column(String(64), nullable=True)
    femaleCoApplicant = Column(Boolean, nullable=True)
    propertyInsurance = Column(Boolean, nullable=True)
    applicantInsurance = Column(Boolean, nullable=True)
