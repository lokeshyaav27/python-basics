from typing import Optional, List
from sentence_transformers import SentenceTransformer
from core.config import mcp_config

_model_instance: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """
    Returns the singleton instance of the SentenceTransformer embedding model.
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer(mcp_config.EMBEDDING_MODEL_NAME)
    return _model_instance


def generate_embedding(text: str) -> List[float]:
    """
    Generates a dense vector embedding for a single text string.
    """
    model = get_embedding_model()
    return model.encode(text, normalize_embeddings=True).tolist()
