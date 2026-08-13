from sqlalchemy import Column, Integer, String, Boolean
from app.models.base import Base


class Bank(Base):
    __tablename__ = "banks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    isNationalize = Column("isnationalize", Boolean, nullable=False, default=False)
    isPrivate = Column("isprivate", Boolean, nullable=False, default=False)
    isnbfc = Column("isnbfc", Boolean, nullable=False, default=False)
    logo = Column(String(1024), nullable=True)
