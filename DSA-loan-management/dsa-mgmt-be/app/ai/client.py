import logging
from typing import Optional
from groq import Groq
from app.core.config import settings

logger = logging.getLogger("ai_client")
_groq_client_instance: Optional[Groq] = None


def get_groq_client() -> Optional[Groq]:
    """
    Returns the singleton Groq client instance if API key is configured.
    """
    global _groq_client_instance
    if _groq_client_instance is None:
        if settings.GROQ_API_KEY:
            try:
                _groq_client_instance = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                return None
    return _groq_client_instance
