from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.chat import ChatRequest, ChatResponse, ChatAuthContext
from app.services.chat_orchestrator import process_chat_conversation
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/assistant")
def chat_with_loan_assistant(
    req: ChatRequest,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Conversational AI Underwriter endpoint combining RAG, deterministic MCP tools, role-based authorization, and Groq LLM reasoning.
    """
    auth = req.authContext or ChatAuthContext(role="customer")

    auth.role = current_user.role
    auth.userId = current_user.id
    auth.name = current_user.name
    auth.email = current_user.email
    auth.mobile = current_user.mobile
    auth.identifier = current_user.uniqueCustomerId or str(current_user.id or "")

    req.authContext = auth
    result = process_chat_conversation(db=db, request=req)
    return success_response(
        result=result,
        message="Assistant response generated successfully",
    )
