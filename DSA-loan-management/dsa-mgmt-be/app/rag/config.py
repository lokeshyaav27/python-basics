from pydantic import BaseModel, Field


class RAGConfig(BaseModel):
    chunk_size: int = Field(default=1000, description="Maximum character length of each document text chunk")
    chunk_overlap: int = Field(default=150, description="Overlapping character count between consecutive chunks")
    embedding_model_name: str = Field(default="all-MiniLM-L6-v2", description="HuggingFace model for dense vector embeddings")
    embedding_dimension: int = Field(default=384, description="Vector dimension size for pgvector column")
    default_top_k: int = Field(default=4, description="Default number of similar chunks to retrieve")
    similarity_threshold: float = Field(default=0.35, description="Minimum cosine similarity score threshold")


rag_config = RAGConfig()
