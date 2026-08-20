from app.mcp.auth import check_auth_permission
from app.mcp.serializer import serialize_loan_application
from app.mcp.registry import get_all_tool_specs, execute_mcp_tool
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

__all__ = [
    "check_auth_permission",
    "serialize_loan_application",
    "get_all_tool_specs",
    "execute_mcp_tool",
    "ALL_MCP_SPECS",
    "get_customer_details_by_id",
    "get_loan_details_by_customer_id",
    "get_loan_by_id",
    "get_all_loans_by_agent_id",
    "get_all_loans",
    "get_bank_list",
    "get_bank_list_by_product_id",
    "get_commission_structure_by_bank_id",
    "get_all_products",
    "get_agent_list",
    "check_loan_eligibility",
    "compare_banks",
    "search_bank_documents",
]
