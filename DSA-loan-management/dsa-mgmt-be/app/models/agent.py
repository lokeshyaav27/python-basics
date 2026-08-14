from sqlalchemy import Column, Integer, String, Boolean
from app.models.base import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    mobile = Column(String(32), nullable=False)
    tempPassword = Column("temp_password", String(255), nullable=True)
    password = Column(String(255), nullable=True)
    tempPasswordReset = Column("temp_password_reset", Boolean, nullable=False, default=False)
    isAdmin = Column("is_admin", Boolean, nullable=False, default=False)
    photo = Column(String(1024), nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)
