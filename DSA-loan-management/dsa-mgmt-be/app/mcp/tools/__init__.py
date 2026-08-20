from app.mcp.tools.customer_tools import (
    CUSTOMER_TOOLS_SPECS,
    get_customer_details_by_id,
    get_loan_details_by_customer_id,
)
from app.mcp.tools.loan_tools import (
    LOAN_TOOLS_SPECS,
    get_loan_by_id,
    get_all_loans_by_agent_id,
    get_all_loans,
)
from app.mcp.tools.bank_tools import (
    BANK_TOOLS_SPECS,
    get_bank_list,
    get_bank_list_by_product_id,
    get_commission_structure_by_bank_id,
)
from app.mcp.tools.product_tools import (
    PRODUCT_TOOLS_SPECS,
    get_all_products,
)
from app.mcp.tools.agent_tools import (
    AGENT_TOOLS_SPECS,
    get_agent_list,
)
from app.mcp.tools.eligibility_tool import (
    ELIGIBILITY_TOOL_SPEC,
    check_loan_eligibility,
)
from app.mcp.tools.comparison_tool import (
    COMPARISON_TOOL_SPEC,
    compare_banks,
)
from app.mcp.tools.search_tool import (
    SEARCH_TOOL_SPEC,
    search_bank_documents,
)

ALL_MCP_SPECS = [
    ELIGIBILITY_TOOL_SPEC,
    COMPARISON_TOOL_SPEC,
    *CUSTOMER_TOOLS_SPECS,
    *LOAN_TOOLS_SPECS,
    *BANK_TOOLS_SPECS,
    *PRODUCT_TOOLS_SPECS,
    *AGENT_TOOLS_SPECS,
    SEARCH_TOOL_SPEC,
]

__all__ = [
    "ALL_MCP_SPECS",
    "CUSTOMER_TOOLS_SPECS",
    "LOAN_TOOLS_SPECS",
    "BANK_TOOLS_SPECS",
    "PRODUCT_TOOLS_SPECS",
    "AGENT_TOOLS_SPECS",
    "ELIGIBILITY_TOOL_SPEC",
    "COMPARISON_TOOL_SPEC",
    "SEARCH_TOOL_SPEC",
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
