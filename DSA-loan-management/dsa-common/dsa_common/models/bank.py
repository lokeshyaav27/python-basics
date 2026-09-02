from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    isNationalize = Column("is_nationalize", Boolean, nullable=False, default=False)
    isPrivate = Column("is_private", Boolean, nullable=False, default=False)
    isNbfc = Column("is_nbfc", Boolean, nullable=False, default=False)
    logo = Column(String(1024), nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)

    product_links = relationship("ProductBankLink", back_populates="bank", cascade="all, delete-orphan")
