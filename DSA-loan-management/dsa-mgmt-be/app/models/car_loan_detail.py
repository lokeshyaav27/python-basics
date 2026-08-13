from sqlalchemy import Column, Integer, String, Boolean, Numeric
from app.models.base import Base


class CarLoanDetail(Base):
    __tablename__ = "car_loan_details"
    id = Column(Integer, primary_key=True, index=True)
    new_or_used = Column(String(32), nullable=True)
    car_value = Column(Numeric(14, 2), nullable=True)
    down_payment = Column(Numeric(14, 2), nullable=True)
    vehicle_age = Column(Integer, nullable=True)
