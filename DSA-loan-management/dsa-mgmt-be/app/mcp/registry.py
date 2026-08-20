from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.mcp.tools import (
    ALL_MCP_SPECS,
    get_customer_details_by_id,
    get_loan_details_by_customer_id,
    get_loan_by_id,
    get_all_loans_by_agent_id,
    get_all_loans,
    get_bank_list,
    get_bank_list_by_product_id,
    get_commission_structure_by_bank_id,
    get_all_products,
    get_agent_list,
    check_loan_eligibility,
    compare_banks,
    search_bank_documents,
)


def get_all_tool_specs() -> List[Dict[str, Any]]:
    """
    Returns the complete list of MCP tool specifications.
    """
    return ALL_MCP_SPECS


def execute_mcp_tool(
    db: Session,
    tool_name: str,
    arguments: Dict[str, Any],
    auth_user: Optional[Dict[str, Any]] = None,
) -> Any:
    """
    Directs and executes any registered MCP tool by name with arguments and authorization checks.
    """
    name = (tool_name or "").strip()

    if name in ["get_customer_details_by_id", "get_customer_profile"]:
        return get_customer_details_by_id(
            db=db,
            customer_id=arguments.get("customer_id") or arguments.get("customerId", ""),
            auth_user=auth_user,
        )

    elif name in ["get_loan_details_by_customer_id", "get_customer_loans"]:
        return get_loan_details_by_customer_id(
            db=db,
            customer_id=arguments.get("customer_id") or arguments.get("customerId", ""),
            auth_user=auth_user,
        )

    elif name in ["get_loan_by_id", "get_loan_application"]:
        app_id = int(arguments.get("application_id") or arguments.get("applicationId", 0))
        return get_loan_by_id(db=db, application_id=app_id, auth_user=auth_user)

    elif name in ["get_all_loans_by_agent_id", "get_agent_loans"]:
        agent_id = int(arguments.get("agent_id") or arguments.get("agentId", 0))
        return get_all_loans_by_agent_id(db=db, agent_id=agent_id, auth_user=auth_user)

    elif name in ["get_all_loans", "list_all_loans"]:
        return get_all_loans(
            db=db,
            customer_identifier=arguments.get("customer_identifier") or arguments.get("customerIdentifier"),
            auth_user=auth_user,
        )

    elif name in ["get_bank_list", "list_banks"]:
        return get_bank_list(
            db=db,
            include_inactive=bool(arguments.get("include_inactive", False)),
            auth_user=auth_user,
        )

    elif name in ["get_bank_list_by_product_id", "get_banks_by_product"]:
        prod_id = int(arguments.get("product_id") or arguments.get("productId", 0))
        return get_bank_list_by_product_id(db=db, product_id=prod_id, auth_user=auth_user)

    elif name in ["get_commission_structure_by_bank_id", "get_bank_commissions"]:
        bank_id = int(arguments.get("bank_id") or arguments.get("bankId", 0))
        return get_commission_structure_by_bank_id(db=db, bank_id=bank_id, auth_user=auth_user)

    elif name in ["get_all_products", "list_products"]:
        return get_all_products(db=db, auth_user=auth_user)

    elif name in ["get_agent_list", "list_agents"]:
        return get_agent_list(db=db, auth_user=auth_user)

    elif name in ["check_loan_eligibility", "evaluate_loan_eligibility"]:
        app_id = int(arguments.get("application_id") or arguments.get("applicationId", 0))
        return check_loan_eligibility(db=db, application_id=app_id, auth_user=auth_user)

    elif name in ["compare_banks", "compare_bank_offers"]:
        app_id = int(arguments.get("application_id") or arguments.get("applicationId", 0))
        bank_ids = arguments.get("bank_ids") or arguments.get("bankIds") or []
        user_role = arguments.get("user_role") or arguments.get("userRole")
        return compare_banks(
            db=db,
            application_id=app_id,
            bank_ids=bank_ids,
            user_role=user_role,
            auth_user=auth_user,
        )

    elif name in ["search_bank_documents", "search_bank_policies", "semantic_search"]:
        return search_bank_documents(
            db=db,
            query=arguments.get("query", ""),
            bank_id=arguments.get("bank_id") or arguments.get("bankId"),
            product_id=arguments.get("product_id") or arguments.get("productId"),
            top_k=int(arguments.get("top_k", 4)),
            auth_user=auth_user,
        )

    else:
        raise HTTPException(status_code=404, detail=f"MCP Tool '{tool_name}' is not recognized.")
