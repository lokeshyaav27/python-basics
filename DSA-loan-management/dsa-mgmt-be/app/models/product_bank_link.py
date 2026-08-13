from sqlalchemy import Column, Integer, ForeignKey, Numeric
from app.models.base import Base


class ProductBankLink(Base):
    __tablename__ = "product_bank_links"
    id = Column(Integer, primary_key=True, index=True)
    bankid = Column(Integer, ForeignKey("banks.id"), nullable=False)
    productid = Column(Integer, ForeignKey("products.id"), nullable=False)
    commission = Column(Numeric(10, 2), nullable=True)
