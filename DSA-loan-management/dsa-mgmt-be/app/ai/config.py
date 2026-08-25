from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.config import settings


class AIConfig(BaseModel):
    temperature: float = Field(default=0.1, description="Sampling temperature for deterministic output")
    max_tokens: int = Field(default=1500, description="Max tokens per response turn")
    max_agent_turns: int = Field(default=4, description="Max tool-calling iterations per message")

    @property
    def candidate_models(self) -> List[str]:
        """
        Dynamically returns candidate models based on provider toggle (Ollama vs Groq).
        """
        if settings.USE_OLLAMA:
            return [settings.OLLAMA_MODEL] if settings.OLLAMA_MODEL else ["llama3.1:8b"]

        models: List[str] = []
        if settings.GROQ_MODEL:
            models.append(settings.GROQ_MODEL)
        if settings.GROQ_FALLBACK_MODEL and settings.GROQ_FALLBACK_MODEL not in models:
            models.append(settings.GROQ_FALLBACK_MODEL)
        return models


ai_config = AIConfig()
