"""
Backward compatibility adapter for chat_orchestrator.
All AI chat logic and prompts are now located in the `app.ai` package.
"""
from app.ai import chat_service

process_chat_conversation = chat_service.process_chat_conversation

__all__ = ["process_chat_conversation"]
