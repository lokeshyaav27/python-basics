"""
RAG Service adapter for backward compatibility.
The full RAG implementation is now located in the `app.rag` package.
"""
from app.rag import (
    rag_config,
    RAGConfig,
    RAGService,
    rag_service,
    extract_chunks_from_file,
    get_embedding_model,
)

# Function aliases for backward compatibility
index_document = rag_service.index_document
index_pdf_document = rag_service.index_pdf_document
search_relevant_chunks = rag_service.search_relevant_chunks
search_similar_chunks = rag_service.search_similar_chunks
remove_document_chunks = rag_service.remove_document_chunks

__all__ = [
    "rag_config",
    "RAGConfig",
    "RAGService",
    "rag_service",
    "extract_chunks_from_file",
    "get_embedding_model",
    "index_document",
    "index_pdf_document",
    "search_relevant_chunks",
    "search_similar_chunks",
    "remove_document_chunks",
]
