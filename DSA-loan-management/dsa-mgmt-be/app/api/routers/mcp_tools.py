from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from app.db.session import SessionLocal
from app.services.mcp_dsa_tools import (
    MCP_DSA_TOOLS_SPECS,
    execute_dsa_mcp_tool,
    search_bank_documents,
)
from app.services.mcp_eligibility_tool import (
    MCP_ELIGIBILITY_TOOL_SPEC,
    execute_mcp_eligibility_tool,
)
from app.services.mcp_comparison_tool import (
    MCP_COMPARISON_TOOL_SPEC,
    execute_mcp_comparison_tool,
)
from app.core.security import require_role, CurrentUser

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MCPExecuteRequest(BaseModel):
    tool_name: str = Field(..., description="Name of the MCP tool to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments for the tool")
    auth_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional caller authentication context (role: admin/agent/customer, userId, identifier)"
    )


# ── 1. List All Registered MCP Tools ─────────────────────────────────────────
@router.get("/tools")
def list_all_mcp_tools(
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
):
    """
    Returns full Model Context Protocol (MCP) schemas for all available tools in the platform.
    """
    all_specs = list(MCP_DSA_TOOLS_SPECS)
    all_specs.append(MCP_ELIGIBILITY_TOOL_SPEC)
    all_specs.append(MCP_COMPARISON_TOOL_SPEC)
    return {
        "totalTools": len(all_specs),
        "tools": all_specs,
    }


# ── 2. Unified MCP Tool Execution Endpoint ───────────────────────────────────
@router.post("/execute")
def execute_mcp_tool(
    req: MCPExecuteRequest,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Unified entry point for calling any MCP tool with automated authorization checks.
    """
    auth = {
        "role": current_user.role,
        "userId": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "mobile": current_user.mobile,
        "identifier": current_user.uniqueCustomerId or str(current_user.id or ""),
    }

    tool = req.tool_name.strip()

    # Route specialized tools
    if tool == "check_loan_eligibility":
        app_id = int(req.arguments.get("application_id") or req.arguments.get("applicationId"))
        return execute_mcp_eligibility_tool(db=db, application_id=app_id)

    elif tool == "compare_banks":
        app_id = int(req.arguments.get("application_id") or req.arguments.get("applicationId"))
        bank_ids = req.arguments.get("bank_ids") or req.arguments.get("bankIds") or []
        user_role = auth.get("role", "customer")
        return execute_mcp_comparison_tool(db=db, application_id=app_id, bank_ids=bank_ids, user_role=user_role)

    # Route DSA Core Tools
    return execute_dsa_mcp_tool(
        db=db,
        tool_name=tool,
        arguments=req.arguments,
        auth_user=auth,
    )


# ── 3. Semantic Search Endpoint ───────────────────────────────────────────────
class SemanticSearchPayload(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language search query or question")
    bankId: Optional[int] = Field(None, description="Optional bank filter")
    productId: Optional[int] = Field(None, description="Optional product filter")
    topK: int = Field(5, ge=1, le=20, description="Number of relevant chunks")


@router.post("/semantic-search")
def mcp_post_semantic_search(
    payload: SemanticSearchPayload,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Semantic vector search over bank policy documents via pgvector, returning both structured matches and formatted LLM knowledge context.
    """
    return search_bank_documents(
        db=db,
        query=payload.query,
        bank_id=payload.bankId,
        product_id=payload.productId,
        top_k=payload.topK,
    )
