import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure local path resolution
CURRENT_DIR = Path(__file__).resolve().parent

if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from mcp.server.mcpserver import MCPServer
except ImportError:
    from mcp.server.fastmcp import FastMCP as MCPServer

from core.config import mcp_config
from core.auth import resolve_auth_user, enforce_tool_rbac
from tools.policy_search import handle_search_bank_policies
from tools.eligibility import handle_check_loan_eligibility
from tools.comparison import handle_compare_bank_offers
from tools.dossier import handle_get_loan_dossier
from tools.catalog import handle_get_bank_product_catalog
from tools.directory import handle_get_agent_directory
from tools.analytics import handle_get_commission_analytics, handle_get_portfolio_kpis
from tools.enquiries import handle_get_contact_enquiries
from resources.bank_catalog import get_bank_catalog_resource, get_product_catalog_resource
from resources.policy_docs import get_bank_policy_resource
from prompts.underwriting import get_underwriting_review_prompt
from prompts.rate_comparison import get_rate_comparison_prompt

logger = logging.getLogger("dsa_mcp_server")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Instantiate MCPServer
mcp = MCPServer(
    name=mcp_config.SERVER_NAME,
    version=mcp_config.SERVER_VERSION,
    instructions=(
        "DSA Loan Management MCP Server providing credit underwriting calculation, "
        "multi-bank comparison engine, RAG semantic policy search, customer dossier lookups, "
        "and commission analytics with role-based authorization."
    ),
)


# ============================================================================
# MCP TOOLS
# ============================================================================

@mcp.tool(
    name="search_bank_policies",
    description=(
        "Performs semantic vector search across partner bank credit policy documents, "
        "eligibility guidelines, interest rate matrices, prepayment rules, FOIR/LTV thresholds, "
        "and required documentation using pgvector. Pass the query text and optional bank/product IDs."
    ),
)
def search_bank_policies(
    query: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 3,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Semantic vector search for bank credit policies."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: search_bank_policies] Start | Query: '{query}'")
    result = handle_search_bank_policies(
        query=query,
        bank_id=bank_id,
        product_id=product_id,
        top_k=top_k,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: search_bank_policies] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="check_loan_eligibility",
    description=(
        "Evaluates applicant loan eligibility based on DSA credit underwriting standards and bank policies. "
        "Calculates FOIR (debt-to-income ratio), LTV (loan-to-value), maximum eligible loan amount, monthly EMI, "
        "income surplus, positive underwriting factors, and specific reduction/rejection reasons."
    ),
)
def check_loan_eligibility(
    application_id: int,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Credit underwriting calculation."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: check_loan_eligibility] Start | Application #{application_id}")
    result = handle_check_loan_eligibility(
        application_id=application_id,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: check_loan_eligibility] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="compare_bank_offers",
    description=(
        "Generates a multi-bank comparative evaluation matrix across partner banks for a specific loan application. "
        "Evaluates interest rates (ROI), maximum eligible loan amount, monthly EMI, total interest payable, "
        "processing fees, insurance requirements, and internal DSA payout commissions."
    ),
)
def compare_bank_offers(
    application_id: int,
    bank_ids: Optional[List[int]] = None,
    user_role: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Multi-bank rate & EMI quote comparison."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: compare_bank_offers] Start | Application #{application_id}")
    result = handle_compare_bank_offers(
        application_id=application_id,
        bank_ids=bank_ids,
        user_role=user_role,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: compare_bank_offers] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="get_loan_dossier",
    description=(
        "Unified lookup tool for loan applications and customer dossiers. "
        "Can fetch: (1) a specific loan application with full underwriting and collateral details (pass application_id), "
        "(2) a customer's full profile and loan history (pass customer_id), "
        "(3) an agent's assigned active loan pipeline (pass agent_id), or "
        "(4) general loans matching a search query (pass customer_identifier)."
    ),
)
def get_loan_dossier(
    application_id: Optional[int] = None,
    customer_id: Optional[str] = None,
    agent_id: Optional[int] = None,
    customer_identifier: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Unified loan application and customer dossier fetcher."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: get_loan_dossier] Start | AppId={application_id}, CustId={customer_id}, AgentId={agent_id}")
    result = handle_get_loan_dossier(
        application_id=application_id,
        customer_id=customer_id,
        agent_id=agent_id,
        customer_identifier=customer_identifier,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: get_loan_dossier] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="get_bank_product_catalog",
    description=(
        "Fetches partner bank and product catalogs. Can retrieve: "
        "(1) all partner banks offering a specific loan product (pass product_id), "
        "(2) a bank's detailed profile and commission structure (pass bank_id), or "
        "(3) all active loan products and partner lending institutions."
    ),
)
def get_bank_product_catalog(
    product_id: Optional[int] = None,
    bank_id: Optional[int] = None,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Bank and product catalog."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: get_bank_product_catalog] Start | ProductId={product_id}, BankId={bank_id}")
    result = handle_get_bank_product_catalog(
        product_id=product_id,
        bank_id=bank_id,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: get_bank_product_catalog] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="get_agent_directory",
    description=(
        "Directory lookup tool for DSA loan agents, administrators, and team performance metrics. "
        "Allows fetching: (1) full list of agents with assigned loan counts and volume (pass with_workload_metrics=true), "
        "(2) detailed profile for a specific agent (pass agent_id), or "
        "(3) active/inactive agent roster. Restricted to Administrator role only."
    ),
)
def get_agent_directory(
    agent_id: Optional[int] = None,
    include_inactive: Optional[bool] = False,
    with_workload_metrics: Optional[bool] = True,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Agent directory and team workload (Admin only)."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: get_agent_directory] Start | AgentId={agent_id}")
    result = handle_get_agent_directory(
        agent_id=agent_id,
        include_inactive=include_inactive,
        with_workload_metrics=with_workload_metrics,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: get_agent_directory] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="get_commission_analytics",
    description=(
        "Calculates and aggregates DSA commission revenue, earned payouts, and pipeline margins. "
        "Can aggregate: (1) total realized commission from disbursed/approved loans, "
        "(2) projected pipeline commission, (3) bank-wise commission breakdown, "
        "(4) agent-wise commission splits (Admin only), or (5) product-wise commissions. "
        "Restricted to Admin (all platform) and Agent (personal earnings only)."
    ),
)
def get_commission_analytics(
    agent_id: Optional[int] = None,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    status: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: DSA commission and revenue analytics."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: get_commission_analytics] Start | AgentId={agent_id}, BankId={bank_id}")
    result = handle_get_commission_analytics(
        agent_id=agent_id,
        bank_id=bank_id,
        product_id=product_id,
        status=status,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: get_commission_analytics] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="get_portfolio_kpis",
    description=(
        "Retrieves high-level loan portfolio KPIs, status distributions, unique customer counts, "
        "and volume totals across the DSA lending pipeline. Useful for executive summaries and pipeline health checks."
    ),
)
def get_portfolio_kpis(
    product_type: Optional[str] = None,
    agent_id: Optional[int] = None,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Portfolio KPIs and status distribution."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: get_portfolio_kpis] Start | ProductType={product_type}, AgentId={agent_id}")
    result = handle_get_portfolio_kpis(
        product_type=product_type,
        agent_id=agent_id,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: get_portfolio_kpis] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


@mcp.tool(
    name="get_contact_enquiries",
    description=(
        "Fetches customer lead enquiries submitted through the public website contact form. "
        "Allows filtering by status ('New', 'In-Progress', 'Resolved', 'all') and loan type. "
        "Restricted to Admin and Agent roles."
    ),
)
def get_contact_enquiries(
    status: Optional[str] = None,
    loan_type: Optional[str] = None,
    limit: Optional[int] = 20,
    auth_token: Optional[str] = None,
) -> Dict[str, Any]:
    """MCP Tool: Customer contact leads and enquiries."""
    t0 = time.perf_counter()
    logger.info(f"⚡ [RPC tools/call: get_contact_enquiries] Start | Status={status}, Limit={limit}")
    result = handle_get_contact_enquiries(
        status=status,
        loan_type=loan_type,
        limit=limit,
        auth_token=auth_token,
    )
    logger.info(f"⚡ [RPC tools/call: get_contact_enquiries] Completed in {(time.perf_counter() - t0)*1000:.1f}ms")
    return result


# ============================================================================
# MCP RESOURCES
# ============================================================================

@mcp.resource("dsa://catalog/banks")
def resource_bank_catalog() -> str:
    """Live JSON catalog of active partner banks."""
    logger.info("📦 [RPC resources/read: dsa://catalog/banks]")
    return get_bank_catalog_resource()


@mcp.resource("dsa://catalog/products")
def resource_product_catalog() -> str:
    """Live JSON catalog of active loan products."""
    logger.info("📦 [RPC resources/read: dsa://catalog/products]")
    return get_product_catalog_resource()


@mcp.resource("dsa://policies/{bank_id}")
def resource_bank_policies(bank_id: int) -> str:
    """Indexed policy documents and guidelines for a specific bank."""
    logger.info(f"📦 [RPC resources/read: dsa://policies/{bank_id}]")
    return get_bank_policy_resource(int(bank_id))


# ============================================================================
# MCP PROMPT TEMPLATES
# ============================================================================

@mcp.prompt("underwriting_review")
def prompt_underwriting(application_id: int) -> str:
    """Standardized credit underwriting prompt template."""
    logger.info(f"📝 [RPC prompts/get: underwriting_review] App #{application_id}")
    return get_underwriting_review_prompt(int(application_id))


@mcp.prompt("compare_bank_offers")
def prompt_rate_comparison(application_id: int, bank_names: Optional[str] = None) -> str:
    """Multi-bank rate comparison prompt template."""
    logger.info(f"📝 [RPC prompts/get: compare_bank_offers] App #{application_id}")
    return get_rate_comparison_prompt(int(application_id), bank_names=bank_names)


# ============================================================================
# CLI ENTRYPOINT
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="DSA Loan Management MCP Server")
    parser.add_argument(
        "--transport",
        choices=["sse", "stdio", "streamable-http"],
        default="sse",
        help="Transport protocol (default: sse)",
    )
    parser.add_argument("--host", default=mcp_config.HOST, help=f"Host (default: {mcp_config.HOST})")
    parser.add_argument("--port", type=int, default=mcp_config.PORT, help=f"Port (default: {mcp_config.PORT})")

    args = parser.parse_args()

    logger.info(f"🚀 Starting {mcp_config.SERVER_NAME} v{mcp_config.SERVER_VERSION} on transport '{args.transport}' at {args.host}:{args.port}...")

    if args.transport == "sse":
        mcp.run(transport="sse", host=args.host, port=args.port)
    elif args.transport == "stdio":
        mcp.run(transport="stdio")
    elif args.transport == "streamable-http":
        mcp.run(transport="streamable-http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
