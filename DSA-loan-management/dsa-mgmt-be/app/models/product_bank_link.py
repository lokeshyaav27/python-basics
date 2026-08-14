from sqlalchemy import Column, Integer, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship
from app.models.base import Base


class ProductBankLink(Base):
    __tablename__ = "product_bank_links"
    id = Column(Integer, primary_key=True, index=True)
    bankid = Column(Integer, ForeignKey("banks.id"), nullable=False)
    productid = Column(Integer, ForeignKey("products.id"), nullable=False)
    commission = Column(Numeric(10, 2), nullable=True)
    policyDocument = Column("policydocument", String(1024), nullable=True)

    bank = relationship("Bank", backref="product_links")
    product = relationship("Product", backref="bank_links")

