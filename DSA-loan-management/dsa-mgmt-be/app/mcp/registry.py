from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.mcp.tools import (
    ALL_MCP_SPECS,
    search_bank_policies,
    check_loan_eligibility,
    compare_bank_offers,
    get_loan_dossier,
    get_bank_product_catalog,
    get_agent_directory,
    get_commission_analytics,
    get_portfolio_kpis,
    get_contact_enquiries,
)


def _parse_int(val: Any) -> Optional[int]:
    """Safely converts value to int, handling 'null', None, and non-digits gracefully."""
    if val is None:
        return None
    s = str(val).strip().lower()
    if s in ["null", "none", "", "undefined"]:
        return None
    try:
        return int(s)
    except (ValueError, TypeError):
        return None


def _parse_bool(val: Any, default: bool = False) -> bool:
    """Safely converts value to boolean."""
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    if s in ["true", "1", "yes"]:
        return True
    if s in ["false", "0", "no", "null", "none"]:
        return False
    return default


def get_all_tool_specs() -> List[Dict[str, Any]]:
    """
    Returns the complete list of all registered MCP tool specifications.
    """
    return ALL_MCP_SPECS


# Role-Based Tool Visibility Mapping
CUSTOMER_TOOL_NAMES = {
    "search_bank_policies",
    "check_loan_eligibility",
    "compare_bank_offers",
    "get_loan_dossier",
    "get_bank_product_catalog",
}

AGENT_TOOL_NAMES = CUSTOMER_TOOL_NAMES | {
    "get_commission_analytics",
    "get_portfolio_kpis",
    "get_contact_enquiries",
}


def get_tools_for_role(user_role: str) -> List[Dict[str, Any]]:
    """
    Returns only the MCP tool specifications permitted for a given user role.
    - Customer: Only policy search, eligibility, comparison, own dossier, and catalog.
    - Agent: Customer tools + personal commission analytics, portfolio KPIs, and contact leads.
    - Admin: All 9 tools (including full agent directory and team workload).
    """
    r = (user_role or "customer").lower()
    if r == "admin":
        return ALL_MCP_SPECS
    elif r == "agent":
        return [s for s in ALL_MCP_SPECS if s["name"] in AGENT_TOOL_NAMES]
    else:  # customer
        return [s for s in ALL_MCP_SPECS if s["name"] in CUSTOMER_TOOL_NAMES]


def execute_mcp_tool(
    db: Session,
    tool_name: str,
    arguments: Dict[str, Any],
    auth_user: Optional[Dict[str, Any]] = None,
) -> Any:
    """
    Directs and executes any of the registered MCP tools by exact name with arguments and authorization checks.
    """
    name = (tool_name or "").strip()

    # Tool 1: RAG Semantic Policy Search
    if name == "search_bank_policies":
        return search_bank_policies(
            db=db,
            query=arguments.get("query", ""),
            bank_id=_parse_int(arguments.get("bank_id")),
            product_id=_parse_int(arguments.get("product_id")),
            top_k=_parse_int(arguments.get("top_k")) or 4,
            auth_user=auth_user,
        )

    # Tool 2: Credit Underwriting Eligibility Calculation
    elif name == "check_loan_eligibility":
        app_id = _parse_int(arguments.get("application_id")) or 0
        return check_loan_eligibility(db=db, application_id=app_id, auth_user=auth_user)

    # Tool 3: Multi-Bank Comparison Engine
    elif name == "compare_bank_offers":
        app_id = _parse_int(arguments.get("application_id")) or 0
        bank_ids = arguments.get("bank_ids")
        user_role = arguments.get("user_role")
        return compare_bank_offers(
            db=db,
            application_id=app_id,
            bank_ids=bank_ids,
            user_role=user_role,
            auth_user=auth_user,
        )

    # Tool 4: Unified Loan & Customer Dossier Lookup
    elif name == "get_loan_dossier":
        app_id = _parse_int(arguments.get("application_id"))
        agent_id = _parse_int(arguments.get("agent_id"))
        customer_id = arguments.get("customer_id")
        customer_ident = arguments.get("customer_identifier")

        return get_loan_dossier(
            db=db,
            application_id=app_id,
            customer_id=customer_id,
            agent_id=agent_id,
            customer_identifier=customer_ident,
            auth_user=auth_user,
        )

    # Tool 5: Unified Bank & Product Catalog
    elif name == "get_bank_product_catalog":
        prod_id = _parse_int(arguments.get("product_id"))
        bank_id = _parse_int(arguments.get("bank_id"))

        return get_bank_product_catalog(
            db=db,
            product_id=prod_id,
            bank_id=bank_id,
            auth_user=auth_user,
        )

    # Tool 6: Agent Directory & Team Workload Metrics (Admin only)
    elif name == "get_agent_directory":
        agent_id = _parse_int(arguments.get("agent_id"))
        include_inactive = _parse_bool(arguments.get("include_inactive"), False)
        with_workload_metrics = _parse_bool(arguments.get("with_workload_metrics"), True)

        return get_agent_directory(
            db=db,
            agent_id=agent_id,
            include_inactive=include_inactive,
            with_workload_metrics=with_workload_metrics,
            auth_user=auth_user,
        )

    # Tool 7: DSA Commission & Revenue Analytics (Admin & Agent)
    elif name == "get_commission_analytics":
        agent_id = _parse_int(arguments.get("agent_id"))
        bank_id = _parse_int(arguments.get("bank_id"))
        prod_id = _parse_int(arguments.get("product_id"))

        return get_commission_analytics(
            db=db,
            agent_id=agent_id,
            bank_id=bank_id,
            product_id=prod_id,
            status=arguments.get("status"),
            auth_user=auth_user,
        )

    # Tool 8: Portfolio KPI & Status Distribution (Admin & Agent)
    elif name == "get_portfolio_kpis":
        agent_id = _parse_int(arguments.get("agent_id"))

        return get_portfolio_kpis(
            db=db,
            product_type=arguments.get("product_type"),
            agent_id=agent_id,
            auth_user=auth_user,
        )

    # Tool 9: Contact Lead Enquiries (Admin & Agent)
    elif name == "get_contact_enquiries":
        limit = _parse_int(arguments.get("limit")) or 20

        return get_contact_enquiries(
            db=db,
            status=arguments.get("status"),
            loan_type=arguments.get("loan_type"),
            limit=limit,
            auth_user=auth_user,
        )

    else:
        raise HTTPException(status_code=404, detail=f"MCP Tool '{tool_name}' is not recognized.")


