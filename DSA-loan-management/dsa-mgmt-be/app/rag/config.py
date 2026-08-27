from pydantic import BaseModel, Field
from app.core.config import settings

# ==============================================================================
# NOTE ON `default_factory=lambda: ...`:
#
# 1. What is `lambda`?
#    - In Python, `lambda` is an anonymous, one-line function.
#    - Writing `lambda: settings.RAG_CHUNK_SIZE` is equivalent to:
#        def get_chunk_size():
#            return settings.RAG_CHUNK_SIZE
#    - Similar to JavaScript/TypeScript arrow functions: `() => settings.RAG_CHUNK_SIZE`
#
# 2. Why use `default_factory` with `lambda` instead of `default=...`?
#    - `default_factory` expects a Callable (a function), not a static value.
#    - It calls this function dynamically each time a new `RAGConfig()` is instantiated,
#      ensuring it always reads the latest values from `settings` (e.g. if loaded from environment).
#    - Passing `settings.RAG_CHUNK_SIZE` directly to `default_factory` would fail because an
#      integer is not callable; wrapping it in `lambda:` satisfies the callable requirement.
#
# Example:
#   # Direct value (evaluated once at file import):
#   chunk_size: int = Field(default=500)
#
#   # Callable factory (evaluated dynamically when RAGConfig() is created):
#   chunk_size: int = Field(default_factory=lambda: settings.RAG_CHUNK_SIZE)
# ==============================================================================


class RAGConfig(BaseModel):
    chunk_size: int = Field(default_factory=lambda: settings.RAG_CHUNK_SIZE, description="Maximum character length of each document text chunk")
    chunk_overlap: int = Field(default_factory=lambda: settings.RAG_CHUNK_OVERLAP, description="Overlapping character count between consecutive chunks")
    embedding_model_name: str = Field(default_factory=lambda: settings.RAG_EMBEDDING_MODEL, description="HuggingFace model for dense vector embeddings")
    embedding_dimension: int = Field(default=384, description="Vector dimension size for pgvector column")
    default_top_k: int = Field(default_factory=lambda: settings.RAG_DEFAULT_TOP_K, description="Default number of similar chunks to retrieve")
    similarity_threshold: float = Field(default_factory=lambda: settings.RAG_SIMILARITY_THRESHOLD, description="Minimum cosine similarity score threshold")


rag_config = RAGConfig()
