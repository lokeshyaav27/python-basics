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
from app.mcp.tools.agent_tools import (
    GET_AGENT_DIRECTORY_SPEC,
    get_agent_directory,
)
from app.mcp.tools.analytics_tools import (
    GET_COMMISSION_ANALYTICS_SPEC,
    GET_PORTFOLIO_KPIS_SPEC,
    get_commission_analytics,
    get_portfolio_kpis,
)
from app.mcp.tools.enquiry_tools import (
    GET_CONTACT_ENQUIRIES_SPEC,
    get_contact_enquiries,
)

# The Complete Suite of MCP Tools
ALL_MCP_SPECS = [
    SEARCH_BANK_POLICIES_SPEC,
    CHECK_LOAN_ELIGIBILITY_SPEC,
    COMPARE_BANK_OFFERS_SPEC,
    GET_LOAN_DOSSIER_SPEC,
    GET_BANK_PRODUCT_CATALOG_SPEC,
    GET_AGENT_DIRECTORY_SPEC,
    GET_COMMISSION_ANALYTICS_SPEC,
    GET_PORTFOLIO_KPIS_SPEC,
    GET_CONTACT_ENQUIRIES_SPEC,
]

__all__ = [
    "ALL_MCP_SPECS",
    "search_bank_policies",
    "check_loan_eligibility",
    "compare_bank_offers",
    "get_loan_dossier",
    "get_bank_product_catalog",
    "get_agent_directory",
    "get_commission_analytics",
    "get_portfolio_kpis",
    "get_contact_enquiries",
]

