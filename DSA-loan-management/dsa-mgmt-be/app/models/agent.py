from sqlalchemy import Column, Integer, String, Boolean
from app.models.base import Base


class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    mobile = Column(String(32), nullable=False)
    password = Column(String(255), nullable=True)
    tempPassword = Column("temppassword", String(255), nullable=True)
    tempPasswordReset = Column("temppasswordreset", Boolean, nullable=False, default=False)
    isAdmin = Column("isadmin", Boolean, nullable=False, default=False)
    photo = Column(String(1024), nullable=True)
