from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class ClientGeneralDetail(Base):
    __tablename__ = "client_general_details"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(32), nullable=True)
    location = Column(String(255), nullable=True)
    employment_type = Column(String(64), nullable=True)
    monthly_income = Column(Numeric(12, 2), nullable=True)
    monthly_obligation = Column(Numeric(12, 2), nullable=True)
    existing_emi = Column(Numeric(12, 2), nullable=True)
    cibil_score = Column(Integer, nullable=True)
    loan_amount_required = Column(Numeric(12, 2), nullable=True)
    preferred_tenure = Column(Integer, nullable=True)
    isSalaried = Column(Boolean, nullable=False, default=True)

    loan_applications = relationship("LoanApplication", back_populates="clientGeneralDetail")
