from app.mcp.tools.loan_tools import (
    GET_LOAN_DOSSIER_SPEC,
    get_loan_dossier,
)
from app.mcp.tools.bank_tools import (
    GET_BANK_PRODUCT_CATALOG_SPEC,
    get_bank_product_catalog,
)
from app.mcp.tools.eligibility_tool import (
    CHECK_LOAN_ELIGIBILITY_SPEC,
    check_loan_eligibility,
)
from app.mcp.tools.comparison_tool import (
    COMPARE_BANK_OFFERS_SPEC,
    compare_bank_offers,
)
from app.mcp.tools.search_tool import (
    SEARCH_BANK_POLICIES_SPEC,
    search_bank_policies,
)

# The 5 Core Orthogonal MCP Tools
ALL_MCP_SPECS = [
    SEARCH_BANK_POLICIES_SPEC,
    CHECK_LOAN_ELIGIBILITY_SPEC,
    COMPARE_BANK_OFFERS_SPEC,
    GET_LOAN_DOSSIER_SPEC,
    GET_BANK_PRODUCT_CATALOG_SPEC,
]

__all__ = [
    "ALL_MCP_SPECS",
    "search_bank_policies",
    "check_loan_eligibility",
    "compare_bank_offers",
    "get_loan_dossier",
    "get_bank_product_catalog",
]
