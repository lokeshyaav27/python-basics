import logging
from typing import Optional, Any
from groq import Groq
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger("ai_client")
_ai_client_instance: Optional[Any] = None


def get_ai_client() -> Optional[Any]:
    """
    Returns the configured LLM client instance (local Ollama via OpenAI SDK or Groq Cloud).
    """
    global _ai_client_instance
    if _ai_client_instance is None:
        if settings.USE_OLLAMA:
            try:
                base_url = settings.OLLAMA_BASE_URL or "http://localhost:11434/v1"
                logger.info(f"Initializing local Ollama AI client at base_url='{base_url}'")
                _ai_client_instance = OpenAI(base_url=base_url, api_key="ollama")
            except Exception as e:
                logger.error(f"Failed to initialize Ollama client: {e}")
                return None
        else:
            if settings.GROQ_API_KEY:
                try:
                    logger.info("Initializing Groq Cloud AI client")
                    _ai_client_instance = Groq(api_key=settings.GROQ_API_KEY)
                except Exception as e:
                    logger.error(f"Failed to initialize Groq client: {e}")
                    return None
            else:
                logger.warning("GROQ_API_KEY is not configured and USE_OLLAMA is False.")
                return None
    return _ai_client_instance


# Backward-compatible alias for existing service modules
get_groq_client = get_ai_client
