from pydantic import BaseModel, Field
from typing import List
from app.core.config import settings


class AIConfig(BaseModel):
    primary_model: str = Field(default_factory=lambda: settings.GROQ_MODEL or "openai/gpt-oss-120b")
    fallback_models: List[str] = Field(
        default=["openai/gpt-oss-20b", "qwen/qwen3.6-27b", "llama-3.3-70b-versatile"]
    )
    temperature: float = Field(default=0.1, description="Sampling temperature for deterministic output")
    max_tokens: int = Field(default=1500, description="Max tokens per response turn")
    max_agent_turns: int = Field(default=4, description="Max tool-calling iterations per message")


ai_config = AIConfig()
