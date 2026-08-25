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


def get_all_tool_specs() -> List[Dict[str, Any]]:
    """
    Returns the complete list of all registered MCP tool specifications.
    """
    return ALL_MCP_SPECS


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
            bank_id=arguments.get("bank_id"),
            product_id=arguments.get("product_id"),
            top_k=int(arguments.get("top_k", 4)),
            auth_user=auth_user,
        )

    # Tool 2: Credit Underwriting Eligibility Calculation
    elif name == "check_loan_eligibility":
        app_id = int(arguments.get("application_id", 0))
        return check_loan_eligibility(db=db, application_id=app_id, auth_user=auth_user)

    # Tool 3: Multi-Bank Comparison Engine
    elif name == "compare_bank_offers":
        app_id = int(arguments.get("application_id", 0))
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
        raw_app_id = arguments.get("application_id")
        app_id = int(raw_app_id) if raw_app_id else None

        raw_agent_id = arguments.get("agent_id")
        agent_id = int(raw_agent_id) if raw_agent_id else None

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
        raw_prod_id = arguments.get("product_id")
        prod_id = int(raw_prod_id) if raw_prod_id else None

        raw_bank_id = arguments.get("bank_id")
        bank_id = int(raw_bank_id) if raw_bank_id else None

        return get_bank_product_catalog(
            db=db,
            product_id=prod_id,
            bank_id=bank_id,
            auth_user=auth_user,
        )

    # Tool 6: Agent Directory & Team Workload Metrics (Admin only)
    elif name == "get_agent_directory":
        raw_agent_id = arguments.get("agent_id")
        agent_id = int(raw_agent_id) if raw_agent_id else None

        return get_agent_directory(
            db=db,
            agent_id=agent_id,
            include_inactive=arguments.get("include_inactive", False),
            with_workload_metrics=arguments.get("with_workload_metrics", True),
            auth_user=auth_user,
        )

    # Tool 7: DSA Commission & Revenue Analytics (Admin & Agent)
    elif name == "get_commission_analytics":
        raw_agent_id = arguments.get("agent_id")
        agent_id = int(raw_agent_id) if raw_agent_id else None

        raw_bank_id = arguments.get("bank_id")
        bank_id = int(raw_bank_id) if raw_bank_id else None

        raw_prod_id = arguments.get("product_id")
        prod_id = int(raw_prod_id) if raw_prod_id else None

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
        raw_agent_id = arguments.get("agent_id")
        agent_id = int(raw_agent_id) if raw_agent_id else None

        return get_portfolio_kpis(
            db=db,
            product_type=arguments.get("product_type"),
            agent_id=agent_id,
            auth_user=auth_user,
        )

    # Tool 9: Contact Lead Enquiries (Admin & Agent)
    elif name == "get_contact_enquiries":
        raw_limit = arguments.get("limit")
        limit = int(raw_limit) if raw_limit else 20

        return get_contact_enquiries(
            db=db,
            status=arguments.get("status"),
            loan_type=arguments.get("loan_type"),
            limit=limit,
            auth_user=auth_user,
        )

    else:
        raise HTTPException(status_code=404, detail=f"MCP Tool '{tool_name}' is not recognized.")

