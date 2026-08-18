from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.schemas.chat import ChatRequest, ChatResponse, ChatAuthContext
from app.services.chat_orchestrator import process_chat_conversation

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/assistant", response_model=ChatResponse)
def chat_with_loan_assistant(
    req: ChatRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_customer_id: Optional[str] = Header(None, alias="X-Customer-Id"),
    db: Session = Depends(get_db),
):
    """
    Conversational AI Underwriter endpoint combining RAG, deterministic MCP tools, role-based authorization, and Groq LLM reasoning.
    """
    # Augment auth context from headers if provided
    auth = req.authContext or ChatAuthContext(role="customer")
    if x_user_role:
        auth.role = x_user_role
    if x_user_id and x_user_id.isdigit():
        auth.userId = int(x_user_id)
    if x_customer_id:
        auth.identifier = x_customer_id

    req.authContext = auth
    return process_chat_conversation(db=db, request=req)
