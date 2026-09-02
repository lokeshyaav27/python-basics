from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from dsa_common.models import BankDocumentChunk
from app.rag.config import rag_config, RAGConfig
from app.rag.text_extractor import extract_chunks_from_file
from app.rag.embeddings import get_embedding_model


class RAGService:
    def __init__(self, config: Optional[RAGConfig] = None):
        self.config = config or rag_config

    def index_document(
        self,
        db: Session,
        bank_document_id: int,
        bank_id: int,
        product_id: int,
        file_path: Path | str,
    ) -> int:
        """
        Extracts, encodes, and saves vector chunks for a bank document into pgvector.
        Returns the number of indexed chunks.
        """
        p = Path(file_path) if isinstance(file_path, str) else file_path

        # 1. Clean any existing chunks for this bank_document_id
        db.query(BankDocumentChunk).filter(BankDocumentChunk.bankDocumentId == bank_document_id).delete()
        db.commit()

        # 2. Extract text chunks
        extracted = extract_chunks_from_file(
            p,
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
        )
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
        self,
        db: Session,
        query_text: str,
        bank_id: Optional[int] = None,
        product_id: Optional[int] = None,
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Performs cosine similarity vector search on bank_document_chunks using pgvector.
        Returns top_k matching chunks with similarity score and metadata.
        """
        if not query_text or not query_text.strip():
            return []

        limit = top_k or self.config.default_top_k

        # 1. Generate query vector
        model = get_embedding_model()

        # normalize_embeddings=True Normalization ensures that only the semantic direction (meaning) is compared, not the length or size of the text.
        query_vector = model.encode(query_text.strip(), normalize_embeddings=True).tolist()

        # 2. Build filtered SQL query using pgvector's cosine distance operator (<=>)
        query_vector_str = "[" + ",".join(str(x) for x in query_vector) + "]"
        
        where_clauses = ["1=1"]
        params = {"query_vec": query_vector_str, "top_k": limit}

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

    def remove_document_chunks(self, db: Session, bank_document_id: int) -> int:
        """
        Removes all indexed vector chunks for a given bank document ID.
        """
        deleted_count = db.query(BankDocumentChunk).filter(
            BankDocumentChunk.bankDocumentId == bank_document_id
        ).delete()
        db.commit()
        return deleted_count


rag_service = RAGService()
