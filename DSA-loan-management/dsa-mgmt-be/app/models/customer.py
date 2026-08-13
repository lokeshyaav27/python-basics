from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    mobile = Column(String(32), nullable=False)
    agentId = Column(Integer, ForeignKey("agents.id"), nullable=True)
    LoanId = Column(Integer, ForeignKey("loans.id"), nullable=True)
    status = Column(String(32), nullable=False, default="not-started")

    agent = relationship("Agent", backref="customers")
