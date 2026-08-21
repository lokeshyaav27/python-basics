from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.config import settings


class AIConfig(BaseModel):
    primary_model: str = Field(default_factory=lambda: settings.GROQ_MODEL)
    fallback_model: Optional[str] = Field(default_factory=lambda: settings.GROQ_FALLBACK_MODEL or None)
    temperature: float = Field(default=0.1, description="Sampling temperature for deterministic output")
    max_tokens: int = Field(default=1500, description="Max tokens per response turn")
    max_agent_turns: int = Field(default=4, description="Max tool-calling iterations per message")

    @property
    def candidate_models(self) -> List[str]:
        models: List[str] = []
        if self.primary_model:
            models.append(self.primary_model)
        if self.fallback_model and self.fallback_model not in models:
            models.append(self.fallback_model)
        return models


ai_config = AIConfig()
