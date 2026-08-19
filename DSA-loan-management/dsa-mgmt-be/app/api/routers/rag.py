from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from app.db.session import SessionLocal
from app.services import rag_service

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
