from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.models.base import Base


class BankDocumentChunk(Base):
    __tablename__ = "bank_document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    bankDocumentId = Column("bank_document_id", Integer, ForeignKey("bank_documents.id", ondelete="CASCADE"), nullable=False)
    bankId = Column("bank_id", Integer, ForeignKey("banks.id", ondelete="CASCADE"), nullable=False)
    productId = Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    chunkIndex = Column("chunk_index", Integer, nullable=False)
    pageNumber = Column("page_number", Integer, nullable=True)
    chunkText = Column("chunk_text", Text, nullable=False)
    embedding = Column(Vector(384), nullable=False)
    createdAt = Column("created_at", DateTime, default=datetime.utcnow)

    document = relationship("BankDocument", back_populates="chunks")
    bank = relationship("Bank")
    product = relationship("Product")
