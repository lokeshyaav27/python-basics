from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Union

from app.db.session import SessionLocal
from app.services.mcp_dsa_tools import (
    execute_dsa_mcp_tool,
    MCP_DSA_TOOLS_SPECS,
    get_customer_details_by_id,
    get_loan_details_by_customer_id,
    get_all_customer_of_agent,
    get_all_loans_of_agent,
    get_loan_by_id,
    get_products,
    get_product_by_id,
    get_banks,
    get_bank_by_id,
    get_all_loans_of_customers,
)
from app.services.mcp_eligibility_tool import MCP_ELIGIBILITY_TOOL_SPEC, execute_mcp_eligibility_tool
from app.services.mcp_comparison_tool import MCP_COMPARISON_TOOL_SPEC, execute_mcp_comparison_tool

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
def list_all_mcp_tools():
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
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_customer_id: Optional[str] = Header(None, alias="X-Customer-Id"),
    db: Session = Depends(get_db),
):
    """
    Unified entry point for calling any MCP tool with automated authorization checks.
    """
    auth = req.auth_context or {}
    if x_user_role:
        auth["role"] = x_user_role
    if x_user_id:
        auth["userId"] = x_user_id
    if x_customer_id:
        auth["identifier"] = x_customer_id

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
        auth_user=auth if auth else None,
    )


# ── 3. Direct REST Endpoints for Convenience ─────────────────────────────────
@router.get("/customer/{customer_id}")
def mcp_get_customer_details(
    customer_id: str,
    userRole: Optional[str] = Query("admin"),
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    auth = {"role": userRole, "userId": userId, "identifier": customer_id}
    return get_customer_details_by_id(db, customer_id=customer_id, auth_user=auth)


@router.get("/customer/{customer_id}/loans")
def mcp_get_customer_loans(
    customer_id: str,
    userRole: Optional[str] = Query("admin"),
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    auth = {"role": userRole, "userId": userId, "identifier": customer_id}
    return get_loan_details_by_customer_id(db, customer_id=customer_id, auth_user=auth)


@router.get("/agent/{agent_id}/customers")
def mcp_get_agent_customers(
    agent_id: int,
    userRole: Optional[str] = Query("agent"),
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    auth = {"role": userRole, "userId": userId or str(agent_id)}
    return get_all_customer_of_agent(db, agent_id=agent_id, auth_user=auth)


@router.get("/agent/{agent_id}/loans")
def mcp_get_agent_loans(
    agent_id: int,
    status: Optional[str] = Query(None),
    userRole: Optional[str] = Query("agent"),
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    auth = {"role": userRole, "userId": userId or str(agent_id)}
    return get_all_loans_of_agent(db, agent_id=agent_id, status_filter=status, auth_user=auth)


@router.get("/loan/{loan_id}")
def mcp_get_loan(
    loan_id: int,
    userRole: Optional[str] = Query("admin"),
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    auth = {"role": userRole, "userId": userId}
    return get_loan_by_id(db, loan_id=loan_id, auth_user=auth)


@router.get("/products")
def mcp_list_products(
    isActive: bool = Query(True),
    db: Session = Depends(get_db),
):
    return get_products(db, is_active=isActive)


@router.get("/product/{product_id}")
def mcp_get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    return get_product_by_id(db, product_id=product_id)


@router.get("/banks")
def mcp_list_banks(
    productId: Optional[int] = Query(None),
    isActive: bool = Query(True),
    db: Session = Depends(get_db),
):
    return get_banks(db, product_id=productId, is_active=isActive)


@router.get("/bank/{bank_id}")
def mcp_get_bank(
    bank_id: int,
    db: Session = Depends(get_db),
):
    return get_bank_by_id(db, bank_id=bank_id)


@router.get("/customers/loans")
def mcp_get_all_loans(
    customerIdentifier: Optional[str] = Query(None),
    userRole: Optional[str] = Query("admin"),
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    auth = {"role": userRole, "userId": userId, "identifier": customerIdentifier}
    return get_all_loans_of_customers(db, customer_identifier=customerIdentifier, auth_user=auth)
