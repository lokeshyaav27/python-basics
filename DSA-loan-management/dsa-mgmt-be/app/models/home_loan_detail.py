from sqlalchemy import Column, Integer, String, Boolean, Numeric
from app.models.base import Base


class HomeLoanDetail(Base):
    __tablename__ = "home_loan_details"

    id = Column(Integer, primary_key=True, index=True)
    loan_amount_required = Column(Numeric(14, 2), nullable=True)
    preferred_tenure = Column(Integer, nullable=True)
    property_value = Column(Numeric(14, 2), nullable=True)
    property_location = Column(String(255), nullable=True)
    propertyUsageType = Column("property_usage_type", String(64), nullable=True)
    down_payment = Column(Numeric(14, 2), nullable=True)
    isPartProperty = Column("is_part_property", Boolean, nullable=True, default=False)
    propertyRequirement = Column("property_requirement", String(128), nullable=True)
    propertyType = Column("property_type", String(64), nullable=True)
    propertyStatus = Column("property_status", String(64), nullable=True)
    femaleCoApplicant = Column("female_co_applicant", Boolean, nullable=True, default=False)
    propertyInsurance = Column("property_insurance", Boolean, nullable=True, default=True)
    applicantInsurance = Column("applicant_insurance", Boolean, nullable=True, default=True)
