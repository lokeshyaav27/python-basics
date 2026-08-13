from sqlalchemy import Column, Integer, String, ForeignKey
from app.models.base import Base


class BankDocument(Base):
    __tablename__ = "bank_documents"
    id = Column(Integer, primary_key=True, index=True)
    productBankLinkId = Column(Integer, ForeignKey("product_bank_links.id"), nullable=False)
    nameOfDocuments = Column(String(255), nullable=False)
    documentLocation = Column(String(1024), nullable=False)
