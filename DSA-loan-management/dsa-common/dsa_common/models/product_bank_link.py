from sqlalchemy import Column, Integer, Numeric, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class ProductBankLink(Base):
    __tablename__ = "product_bank_links"

    id = Column(Integer, primary_key=True, index=True)
    bankId = Column("bank_id", Integer, ForeignKey("banks.id", ondelete="CASCADE"), nullable=False)
    productId = Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    commission = Column(Numeric(10, 2), nullable=True)
    policyParameters = Column("policy_parameters", JSON, nullable=True)
    isActive = Column("is_active", Boolean, nullable=False, default=True)

    bank = relationship("Bank", back_populates="product_links")
    product = relationship("Product", backref="bank_links")
    documents = relationship("BankDocument", back_populates="product_link", cascade="all, delete-orphan")
