from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from app.db.session import get_db
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
from app.core.response import success_response

router = APIRouter()


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
    return success_response(
        result={
            "totalTools": len(all_specs),
            "tools": all_specs,
        },
        message="MCP tools schemas retrieved successfully",
    )


# ── 2. Execute Single MCP Tool ───────────────────────────────────────────────
@router.post("/execute")
def execute_single_mcp_tool(
    payload: MCPExecuteRequest,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Executes a named MCP tool deterministically with argument validation and audit logging.
    """
    tool_name = payload.tool_name
    args = payload.arguments or {}

    auth_ctx = payload.auth_context or {}
    auth_ctx["role"] = current_user.role
    auth_ctx["userId"] = current_user.id
    auth_ctx["name"] = current_user.name
    auth_ctx["identifier"] = current_user.uniqueCustomerId or str(current_user.id or "")

    if tool_name == "evaluate_loan_eligibility":
        app_id = args.get("application_id")
        if not app_id:
            raise HTTPException(status_code=400, detail="application_id is required for eligibility tool")
        res = execute_mcp_eligibility_tool(db=db, application_id=int(app_id))
        return success_response(
            result=res,
            message="Eligibility MCP tool executed successfully",
        )

    elif tool_name == "compare_bank_offers":
        app_id = args.get("application_id")
        b_ids = args.get("bank_ids") or []
        if not app_id:
            raise HTTPException(status_code=400, detail="application_id is required for comparison tool")
        res = execute_mcp_comparison_tool(
            db=db,
            application_id=int(app_id),
            bank_ids=b_ids,
            user_role=current_user.role,
        )
        return success_response(
            result=res,
            message="Comparison MCP tool executed successfully",
        )

    else:
        res = execute_dsa_mcp_tool(
            db=db,
            tool_name=tool_name,
            arguments=args,
            auth_context=auth_ctx,
        )
        return success_response(
            result=res,
            message=f"MCP tool '{tool_name}' executed successfully",
        )


# ── 3. RAG Semantic Search Direct Endpoint ───────────────────────────────────
@router.get("/search-policy-docs")
def search_policy_docs_endpoint(
    query: str = Query(..., description="Semantic search query across bank policy documents"),
    bankId: Optional[int] = Query(None, description="Optional bank ID filter"),
    productId: Optional[int] = Query(None, description="Optional product ID filter"),
    topK: int = Query(4, ge=1, le=10, description="Number of top chunks to return"),
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Executes semantic vector similarity search via pgvector on uploaded bank policy documents.
    """
    results = search_bank_documents(
        db=db,
        query=query,
        bank_id=bankId,
        product_id=productId,
        top_k=topK,
    )
    return success_response(
        result={
            "query": query,
            "totalMatches": len(results),
            "matches": results,
        },
        message="Policy document semantic search completed successfully",
    )
