from sqlalchemy import Column, Integer, String, Numeric, Boolean
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class CarLoanDetail(Base):
    __tablename__ = "car_loan_details"

    id = Column(Integer, primary_key=True, index=True)
    loan_amount_required = Column(Numeric(12, 2), nullable=True)
    preferred_tenure = Column(Integer, nullable=True)
    car_value = Column(Numeric(12, 2), nullable=True)
    down_payment = Column(Numeric(12, 2), nullable=True)
    new_or_used = Column(String(32), nullable=True)
    vehicle_age = Column(Integer, nullable=True)

    loan_applications = relationship("LoanApplication", back_populates="carLoanDetail")
