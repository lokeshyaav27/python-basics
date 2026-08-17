import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF
from sqlalchemy.orm import Session
from sqlalchemy import text
from sentence_transformers import SentenceTransformer

from app.models.bank_document_chunk import BankDocumentChunk
from app.models.bank_document import BankDocument
from app.models.bank import Bank
from app.models.product import Product

# Global singleton for SentenceTransformer model
_model_instance: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    global _model_instance
    if _model_instance is None:
        # Fast, lightweight, 384-dimensional dense embedding model
        _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
    return _model_instance


def extract_chunks_from_file(file_path: Path, chunk_size: int = 1000, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF or text documents and returns overlapping chunks with page metadata.
    """
    chunks: List[Dict[str, Any]] = []
    if not file_path.exists():
        return chunks

    ext = file_path.suffix.lower()

    if ext == ".pdf":
        try:
            doc = fitz.open(str(file_path))
            for page_idx, page in enumerate(doc):
                page_text = page.get_text().strip()
                if not page_text:
                    continue

                # Split page text into overlapping windows
                start = 0
                while start < len(page_text):
                    end = start + chunk_size
                    chunk = page_text[start:end].strip()
                    if chunk:
                        chunks.append({
                            "text": chunk,
                            "page_number": page_idx + 1,
                        })
                    start += (chunk_size - chunk_overlap)
            doc.close()
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")
    else:
        # Text/DOC files
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore").strip()
            start = 0
            while start < len(content):
                end = start + chunk_size
                chunk = content[start:end].strip()
                if chunk:
                    chunks.append({
                        "text": chunk,
                        "page_number": 1,
                    })
                start += (chunk_size - chunk_overlap)
        except Exception as e:
            print(f"Error reading text document {file_path}: {e}")

    return chunks


def index_document(
    db: Session,
    bank_document_id: int,
    bank_id: int,
    product_id: int,
    file_path: Path,
) -> int:
    """
    Extracts, encodes, and saves vector chunks for a bank document into pgvector.
    Returns the number of indexed chunks.
    """
    # 1. Clean any existing chunks for this bank_document_id
    db.query(BankDocumentChunk).filter(BankDocumentChunk.bankDocumentId == bank_document_id).delete()
    db.commit()

    # 2. Extract text chunks
    extracted = extract_chunks_from_file(file_path)
    if not extracted:
        return 0

    texts = [c["text"] for c in extracted]

    # 3. Generate embeddings
    model = get_embedding_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)

    # 4. Insert into database
    chunk_objs = []
    for idx, (c, emb) in enumerate(zip(extracted, embeddings)):
        obj = BankDocumentChunk(
            bankDocumentId=bank_document_id,
            bankId=bank_id,
            productId=product_id,
            chunkIndex=idx,
            pageNumber=c.get("page_number"),
            chunkText=c["text"],
            embedding=emb.tolist(),
        )
        chunk_objs.append(obj)

    db.add_all(chunk_objs)
    db.commit()
    return len(chunk_objs)


def search_relevant_chunks(
    db: Session,
    query_text: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Performs cosine similarity vector search on bank_document_chunks using pgvector.
    Returns top_k matching chunks with similarity score and metadata.
    """
    if not query_text.strip():
        return []

    # 1. Generate query vector
    model = get_embedding_model()
    query_vector = model.encode(query_text.strip(), normalize_embeddings=True).tolist()

    # 2. Build filtered SQL query using pgvector's cosine distance operator (<=>)
    query_vector_str = "[" + ",".join(str(x) for x in query_vector) + "]"
    
    where_clauses = ["1=1"]
    params = {"query_vec": query_vector_str, "top_k": top_k}

    if bank_id is not None:
        where_clauses.append("c.bank_id = :bank_id")
        params["bank_id"] = bank_id

    if product_id is not None:
        where_clauses.append("c.product_id = :product_id")
        params["product_id"] = product_id

    where_sql = " AND ".join(where_clauses)

    sql = text(f"""
        SELECT 
            c.id AS chunk_id,
            c.bank_document_id,
            c.bank_id,
            b.name AS bank_name,
            c.product_id,
            p.name AS product_name,
            d.document_name,
            d.document_location,
            c.page_number,
            c.chunk_text,
            1 - (c.embedding <=> :query_vec) AS similarity_score
        FROM bank_document_chunks c
        JOIN banks b ON b.id = c.bank_id
        JOIN products p ON p.id = c.product_id
        JOIN bank_documents d ON d.id = c.bank_document_id
        WHERE {where_sql}
        ORDER BY c.embedding <=> :query_vec
        LIMIT :top_k
    """)

    results = db.execute(sql, params).mappings().all()

    formatted = []
    for r in results:
        formatted.append({
            "chunkId": r["chunk_id"],
            "bankId": r["bank_id"],
            "bankName": r["bank_name"],
            "productId": r["product_id"],
            "productName": r["product_name"],
            "documentId": r["bank_document_id"],
            "documentName": r["document_name"],
            "documentLocation": r["document_location"],
            "pageNumber": r["page_number"],
            "chunkText": r["chunk_text"],
            "similarityScore": round(float(r["similarity_score"]), 4),
        })

    return formatted
