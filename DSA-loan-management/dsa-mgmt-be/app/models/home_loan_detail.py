from sqlalchemy import Column, Integer, String, Boolean, Numeric
from app.models.base import Base


class HomeLoanDetail(Base):
    __tablename__ = "home_loan_details"
    id = Column(Integer, primary_key=True, index=True)
    property_value = Column(Numeric(14, 2), nullable=True)
    property_location = Column(String(255), nullable=True)
    propertyUsageType = Column("propertyusagetype", String(64), nullable=True)
    down_payment = Column(Numeric(14, 2), nullable=True)
    isPartProperty = Column("ispartproperty", Boolean, nullable=True)
    propertyRequirement = Column("propertyrequirement", String(128), nullable=True)
    propertyType = Column("propertytype", String(64), nullable=True)
    propertyStatus = Column("propertystatus", String(64), nullable=True)
    femaleCoApplicant = Column("femalecoapplicant", Boolean, nullable=True)
    propertyInsurance = Column("propertyinsurance", Boolean, nullable=True)
    applicantInsurance = Column("applicantinsurance", Boolean, nullable=True)
