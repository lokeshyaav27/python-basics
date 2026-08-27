import logging
from sqlalchemy.orm import Session
from app.schemas.chat import ChatRequest, ChatResponse
from app.ai.agents.orchestrator_agent import orchestrator_agent

logger = logging.getLogger("ai_chat_service")


class ChatService:
    """
    High-level facade service for conversational AI.
    Delegates all conversational flows to the Master Orchestrator Agent.
    """

    def __init__(self):
        self.orchestrator = orchestrator_agent

    def process_chat_conversation(
        self,
        db: Session,
        request: ChatRequest,
    ) -> ChatResponse:
        """
        Processes chat requests via the Master Orchestrator Agent and specialized Sub-Agents.
        """
        return self.orchestrator.process_conversation(db=db, request=request)


chat_service = ChatService()
