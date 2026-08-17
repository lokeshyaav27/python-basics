from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from pathlib import Path

from app.db.session import SessionLocal
from app.models.bank_document import BankDocument
from app.models.product_bank_link import ProductBankLink
from app.services import rag_service

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_document_storage() -> Path:
    project_root = Path(__file__).resolve().parents[3]
    storage = project_root / 'dsa-file-storage' / 'bank-documents'
    storage.mkdir(parents=True, exist_ok=True)
    return storage


class RagSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language search query")
    bankId: Optional[int] = Field(None, description="Optional bank filter")
    productId: Optional[int] = Field(None, description="Optional product filter")
    topK: int = Field(5, ge=1, le=20, description="Number of relevant chunks to return")


class RagSearchResultItem(BaseModel):
    chunkId: int
    bankId: int
    bankName: str
    productId: int
    productName: str
    documentId: int
    documentName: str
    documentLocation: str
    pageNumber: Optional[int]
    chunkText: str
    similarityScore: float


class RagSearchResponse(BaseModel):
    query: str
    totalMatches: int
    results: List[RagSearchResultItem]


@router.post("/search", response_model=RagSearchResponse)
def search_rag_documents(
    req: RagSearchRequest,
    db: Session = Depends(get_db),
):
    """
    Executes semantic similarity search over bank policy & guideline documents using pgvector.
    """
    matches = rag_service.search_relevant_chunks(
        db=db,
        query_text=req.query,
        bank_id=req.bankId,
        product_id=req.productId,
        top_k=req.topK,
    )

    return {
        "query": req.query,
        "totalMatches": len(matches),
        "results": matches,
    }


@router.post("/reindex-all")
def reindex_all_documents(db: Session = Depends(get_db)):
    """
    Utility endpoint to scan and re-index all existing bank documents into pgvector.
    """
    storage = get_document_storage()
    docs = db.query(BankDocument).all()

    reindexed = 0
    total_chunks = 0

    for doc in docs:
        link = db.query(ProductBankLink).filter(ProductBankLink.id == doc.productBankLinkId).first()
        if not link:
            continue

        file_path = storage / doc.documentLocation
        if file_path.exists():
            cnt = rag_service.index_document(
                db=db,
                bank_document_id=doc.id,
                bank_id=link.bankId,
                product_id=link.productId,
                file_path=file_path,
            )
            reindexed += 1
            total_chunks += cnt

    return {
        "status": "ok",
        "documentsReindexed": reindexed,
        "totalChunks": total_chunks,
    }
