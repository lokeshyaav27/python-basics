from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from dsa_common.models.base import Base


class BankDocument(Base):
    __tablename__ = "bank_documents"

    id = Column(Integer, primary_key=True, index=True)
    productBankLinkId = Column("product_bank_link_id", Integer, ForeignKey("product_bank_links.id", ondelete="CASCADE"), nullable=False)
    documentName = Column("document_name", String(255), nullable=False)
    documentLocation = Column("document_location", String(1024), nullable=False)
    createdAt = Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc))

    product_link = relationship("ProductBankLink", back_populates="documents")
    chunks = relationship("BankDocumentChunk", back_populates="document", cascade="all, delete-orphan")
