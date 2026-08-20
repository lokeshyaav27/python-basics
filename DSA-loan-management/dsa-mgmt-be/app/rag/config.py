from pydantic import BaseModel, Field
from app.core.config import settings


class RAGConfig(BaseModel):
    chunk_size: int = Field(default_factory=lambda: settings.RAG_CHUNK_SIZE, description="Maximum character length of each document text chunk")
    chunk_overlap: int = Field(default_factory=lambda: settings.RAG_CHUNK_OVERLAP, description="Overlapping character count between consecutive chunks")
    embedding_model_name: str = Field(default_factory=lambda: settings.RAG_EMBEDDING_MODEL, description="HuggingFace model for dense vector embeddings")
    embedding_dimension: int = Field(default=384, description="Vector dimension size for pgvector column")
    default_top_k: int = Field(default_factory=lambda: settings.RAG_DEFAULT_TOP_K, description="Default number of similar chunks to retrieve")
    similarity_threshold: float = Field(default_factory=lambda: settings.RAG_SIMILARITY_THRESHOLD, description="Minimum cosine similarity score threshold")


rag_config = RAGConfig()
