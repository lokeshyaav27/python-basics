from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.models.base import Base


class ContactEnquiry(Base):
    __tablename__ = "contact_enquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    mobile = Column(String(32), nullable=False)
    loanType = Column("loan_type", String(64), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="new")
    adminComment = Column("admin_comment", Text, nullable=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())
    isActive = Column("is_active", Boolean, nullable=False, default=True)
