from app.mcp.auth import check_auth_permission
from app.mcp.serializer import serialize_loan_application
from app.mcp.registry import get_all_tool_specs, execute_mcp_tool
from app.mcp.tools import (
    ALL_MCP_SPECS,
    search_bank_policies,
    check_loan_eligibility,
    compare_bank_offers,
    get_loan_dossier,
    get_bank_product_catalog,
)

__all__ = [
    "check_auth_permission",
    "serialize_loan_application",
    "get_all_tool_specs",
    "execute_mcp_tool",
    "ALL_MCP_SPECS",
    "search_bank_policies",
    "check_loan_eligibility",
    "compare_bank_offers",
    "get_loan_dossier",
    "get_bank_product_catalog",
]
