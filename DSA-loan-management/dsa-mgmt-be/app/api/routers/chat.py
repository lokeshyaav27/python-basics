from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.schemas.chat import ChatRequest, ChatResponse, ChatAuthContext
from app.services.chat_orchestrator import process_chat_conversation
from app.core.security import get_current_user_optional, CurrentUser

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
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_customer_id: Optional[str] = Header(None, alias="X-Customer-Id"),
    db: Session = Depends(get_db),
):
    """
    Conversational AI Underwriter endpoint combining RAG, deterministic MCP tools, role-based authorization, and Groq LLM reasoning.
    """
    auth = req.authContext or ChatAuthContext(role="customer")

    # If JWT Bearer token was provided, prioritize validated identity
    if current_user:
        auth.role = current_user.role
        auth.userId = current_user.id
        auth.name = current_user.name
        auth.email = current_user.email
        auth.mobile = current_user.mobile
        auth.identifier = current_user.uniqueCustomerId or str(current_user.id or "")
    else:
        # Augment auth context from headers if provided
        if x_user_role:
            auth.role = x_user_role
        if x_user_id and x_user_id.isdigit():
            auth.userId = int(x_user_id)
        if x_customer_id:
            auth.identifier = x_customer_id

    req.authContext = auth
    return process_chat_conversation(db=db, request=req)
