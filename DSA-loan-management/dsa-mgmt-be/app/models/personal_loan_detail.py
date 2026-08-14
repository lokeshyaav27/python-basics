from sqlalchemy import Column, Integer, String, Numeric
from app.models.base import Base


class PersonalLoanDetail(Base):
    __tablename__ = "personal_loan_details"

    id = Column(Integer, primary_key=True, index=True)
    loan_purpose = Column(String(128), nullable=True)
    other = Column(String(255), nullable=True)
    required_amount = Column(Numeric(14, 2), nullable=True)
    existing_obligations = Column(Numeric(14, 2), nullable=True)
