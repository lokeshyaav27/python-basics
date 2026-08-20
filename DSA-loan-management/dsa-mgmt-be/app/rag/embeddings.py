from typing import Optional, List
from sentence_transformers import SentenceTransformer
from app.rag.config import rag_config

_model_instance: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """
    Returns the singleton instance of the SentenceTransformer embedding model.
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer(rag_config.embedding_model_name)
    return _model_instance


def generate_embedding(text: str) -> List[float]:
    """
    Generates a dense vector embedding for a single text string.
    """
    model = get_embedding_model()
    return model.encode(text).tolist()


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generates dense vector embeddings for a list of text strings in a batch.
    """
    model = get_embedding_model()
    return model.encode(texts).tolist()
