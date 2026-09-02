import asyncio
import concurrent.futures
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure dsa-mgmt-mcp is discoverable
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MCP_DIR = PROJECT_ROOT / "dsa-mgmt-mcp"

if str(MCP_DIR) not in sys.path:
    sys.path.insert(0, str(MCP_DIR))

from app.core.config import settings

logger = logging.getLogger("mcp_client")


# ============================================================================
# STANDARDIZED MCP TOOL SPECIFICATIONS FOR LLM PROMPTING
# ============================================================================

SEARCH_BANK_POLICIES_SPEC = {
    "name": "search_bank_policies",
    "description": (
        "Performs semantic vector search across partner bank credit policy documents, "
        "eligibility guidelines, interest rate matrices, prepayment rules, FOIR/LTV thresholds, "
        "and required documentation using pgvector."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query including bank name or policy topic (e.g. 'HDFC home loan prepayment penalty', 'SBI minimum salary').",
            },
            "bank_id": {
                "type": ["integer", "null"],
                "description": "Optional numeric bank ID to filter search results.",
            },
            "product_id": {
                "type": ["integer", "null"],
                "description": "Optional product ID (e.g., 1 for Home Loan) to filter search results.",
            },
            "top_k": {
                "type": ["integer", "null"],
                "description": "Number of top matching policy excerpts to retrieve (default 3).",
            },
        },
        "required": ["query"],
    },
}

CHECK_LOAN_ELIGIBILITY_SPEC = {
    "name": "check_loan_eligibility",
    "description": (
        "Evaluates applicant loan eligibility based on DSA credit underwriting standards and bank policies. "
        "Calculates FOIR (debt-to-income ratio), LTV (loan-to-value), maximum eligible loan amount, monthly EMI, "
        "income surplus, positive underwriting factors, and specific reduction/rejection reasons."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the customer loan application.",
            }
        },
        "required": ["application_id"],
    },
}

COMPARE_BANK_OFFERS_SPEC = {
    "name": "compare_bank_offers",
    "description": (
        "Generates a multi-bank comparative evaluation matrix across partner banks for a specific loan application. "
        "Evaluates interest rates (ROI), maximum eligible loan amount, monthly EMI, total interest payable, "
        "processing fees, insurance requirements, and internal DSA payout commissions."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the loan application.",
            },
            "bank_ids": {
                "type": ["array", "null"],
                "items": {"type": "integer"},
                "description": "Optional specific list of bank IDs to compare.",
            },
            "user_role": {
                "type": ["string", "null"],
                "enum": ["agent", "admin", "customer"],
                "description": "Optional role override. Defaults to authenticated caller role.",
            },
        },
        "required": ["application_id"],
    },
}

GET_LOAN_DOSSIER_SPEC = {
    "name": "get_loan_dossier",
    "description": (
        "Unified lookup tool for loan applications and customer dossiers. "
        "Can fetch: (1) a specific loan application with full underwriting and collateral details (pass application_id), "
        "(2) a customer's full profile and loan history (pass customer_id), "
        "(3) an agent's assigned active loan pipeline (pass agent_id), or "
        "(4) general loans matching a search query (pass customer_identifier)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": ["integer", "null"],
                "description": "Specific numeric application ID.",
            },
            "customer_id": {
                "type": ["string", "null"],
                "description": "Unique customer ID or mobile number to inspect customer history.",
            },
            "agent_id": {
                "type": ["integer", "null"],
                "description": "DSA Agent ID to list their assigned applications (Agent/Admin only).",
            },
            "customer_identifier": {
                "type": ["string", "null"],
                "description": "Optional search term (name, mobile, or email) to search loan applications.",
            },
        },
    },
}

GET_BANK_PRODUCT_CATALOG_SPEC = {
    "name": "get_bank_product_catalog",
    "description": (
        "Fetches partner bank and product catalogs. Can retrieve: "
        "(1) all partner banks offering a specific loan product (pass product_id), "
        "(2) a bank's detailed profile and commission structure (pass bank_id), or "
        "(3) all active loan products and partner lending institutions."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "product_id": {
                "type": ["integer", "null"],
                "description": "Optional loan product ID (e.g. 1 for Home Loan).",
            },
            "bank_id": {
                "type": ["integer", "null"],
                "description": "Optional numeric partner bank ID to inspect bank details and commission slabs.",
            },
        },
    },
}

GET_AGENT_DIRECTORY_SPEC = {
    "name": "get_agent_directory",
    "description": (
        "Directory lookup tool for DSA loan agents, administrators, and team performance metrics. "
        "Allows fetching: (1) full list of agents with assigned loan counts and volume (pass with_workload_metrics=true), "
        "(2) detailed profile for a specific agent (pass agent_id), or "
        "(3) active/inactive agent roster. Restricted to Administrator role only."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "agent_id": {
                "type": ["integer", "null"],
                "description": "Optional specific agent ID (e.g. 3).",
            },
            "include_inactive": {
                "type": ["boolean", "null"],
                "description": "Whether to include deactivated agents (default: false).",
            },
            "with_workload_metrics": {
                "type": ["boolean", "null"],
                "description": "Whether to include total assigned loan counts and volume per agent (default: true).",
            },
        },
    },
}

GET_COMMISSION_ANALYTICS_SPEC = {
    "name": "get_commission_analytics",
    "description": (
        "Calculates and aggregates DSA commission revenue, earned payouts, and pipeline margins. "
        "Can aggregate: (1) total realized commission from disbursed/approved loans, "
        "(2) projected pipeline commission, (3) bank-wise commission breakdown, "
        "(4) agent-wise commission splits (Admin only), or (5) product-wise commissions. "
        "Restricted to Admin (all platform) and Agent (personal earnings only)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "agent_id": {
                "type": ["integer", "null"],
                "description": "Optional specific agent ID (Admin only; Agents automatically scoped to self).",
            },
            "bank_id": {
                "type": ["integer", "null"],
                "description": "Optional partner bank ID filter.",
            },
            "product_id": {
                "type": ["integer", "null"],
                "description": "Optional product ID filter.",
            },
            "status": {
                "type": ["string", "null"],
                "description": "Optional status filter (e.g. 'Disbursed', 'Approved', 'all').",
            },
        },
    },
}

GET_PORTFOLIO_KPIS_SPEC = {
    "name": "get_portfolio_kpis",
    "description": (
        "Retrieves high-level loan portfolio KPIs, status distributions, unique customer counts, "
        "and volume totals across the DSA lending pipeline."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "product_type": {
                "type": ["string", "null"],
                "description": "Optional product type filter: 'home_loan', 'car_loan', or 'personal_loan'.",
            },
            "agent_id": {
                "type": ["integer", "null"],
                "description": "Optional agent ID filter.",
            },
        },
    },
}

GET_CONTACT_ENQUIRIES_SPEC = {
    "name": "get_contact_enquiries",
    "description": (
        "Fetches customer lead enquiries submitted through the public website contact form. "
        "Allows filtering by status ('New', 'In-Progress', 'Resolved', 'all') and loan type. "
        "Restricted to Admin and Agent roles."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "status": {
                "type": ["string", "null"],
                "description": "Status filter: 'New', 'In-Progress', 'Resolved', or 'all'.",
            },
            "loan_type": {
                "type": ["string", "null"],
                "description": "Product type filter: 'Home Loan', 'Car Loan', 'Personal Loan', or 'all'.",
            },
            "limit": {
                "type": ["integer", "null"],
                "description": "Maximum records to return (default: 20).",
            },
        },
    },
}

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


def _parse_int(val: Any) -> Optional[int]:
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


def _run_async_in_thread(coro):
    """Executes an async coroutine cleanly in a dedicated thread avoiding loop collisions."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(lambda: asyncio.run(coro))
        return future.result(timeout=45)


async def _execute_via_sse(
    server_url: str,
    tool_name: str,
    arguments: Dict[str, Any],
    auth_token: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Any:
    """Connects to remote MCP Server over SSE transport and executes tool."""
    from mcp import ClientSession
    from mcp.client.sse import sse_client
    from app.core.security import create_access_token

    tool_args = dict(arguments or {})
    if auth_token and "auth_token" not in tool_args:
        tool_args["auth_token"] = auth_token
    elif auth_user and "auth_token" not in tool_args:
        try:
            token = create_access_token(data={
                "userId": auth_user.get("userId"),
                "role": auth_user.get("role", "customer"),
                "name": auth_user.get("name", "User"),
            })
            tool_args["auth_token"] = token
        except Exception:
            pass

    async with sse_client(server_url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, tool_args)
            if getattr(result, "isError", False):
                err_text = " ".join(c.text for c in result.content if hasattr(c, "text"))
                return {"status": "ERROR", "error": err_text}

            for content in result.content:
                if hasattr(content, "text"):
                    try:
                        return json.loads(content.text)
                    except Exception:
                        return content.text
            return {"status": "SUCCESS", "result": result}


def _execute_direct(
    tool_name: str,
    arguments: Dict[str, Any],
    auth_user: Optional[Dict[str, Any]] = None,
    auth_token: Optional[str] = None,
) -> Any:
    """Direct in-process handler fallback."""
    from tools.policy_search import handle_search_bank_policies
    from tools.eligibility import handle_check_loan_eligibility
    from tools.comparison import handle_compare_bank_offers
    from tools.dossier import handle_get_loan_dossier
    from tools.catalog import handle_get_bank_product_catalog
    from tools.directory import handle_get_agent_directory
    from tools.analytics import handle_get_commission_analytics, handle_get_portfolio_kpis
    from tools.enquiries import handle_get_contact_enquiries

    name = tool_name
    if name == "search_bank_policies":
        return handle_search_bank_policies(
            query=arguments.get("query", ""),
            bank_id=_parse_int(arguments.get("bank_id")),
            product_id=_parse_int(arguments.get("product_id")),
            top_k=_parse_int(arguments.get("top_k")) or 3,
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "check_loan_eligibility":
        app_id = _parse_int(arguments.get("application_id")) or 0
        return handle_check_loan_eligibility(
            application_id=app_id,
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "compare_bank_offers":
        app_id = _parse_int(arguments.get("application_id")) or 0
        return handle_compare_bank_offers(
            application_id=app_id,
            bank_ids=arguments.get("bank_ids"),
            user_role=arguments.get("user_role"),
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "get_loan_dossier":
        return handle_get_loan_dossier(
            application_id=_parse_int(arguments.get("application_id")),
            customer_id=arguments.get("customer_id"),
            agent_id=_parse_int(arguments.get("agent_id")),
            customer_identifier=arguments.get("customer_identifier"),
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "get_bank_product_catalog":
        return handle_get_bank_product_catalog(
            product_id=_parse_int(arguments.get("product_id")),
            bank_id=_parse_int(arguments.get("bank_id")),
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "get_agent_directory":
        return handle_get_agent_directory(
            agent_id=_parse_int(arguments.get("agent_id")),
            include_inactive=_parse_bool(arguments.get("include_inactive"), False),
            with_workload_metrics=_parse_bool(arguments.get("with_workload_metrics"), True),
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "get_commission_analytics":
        return handle_get_commission_analytics(
            agent_id=_parse_int(arguments.get("agent_id")),
            bank_id=_parse_int(arguments.get("bank_id")),
            product_id=_parse_int(arguments.get("product_id")),
            status=arguments.get("status"),
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "get_portfolio_kpis":
        return handle_get_portfolio_kpis(
            product_type=arguments.get("product_type"),
            agent_id=_parse_int(arguments.get("agent_id")),
            auth_token=auth_token,
            auth_context=auth_user,
        )

    elif name == "get_contact_enquiries":
        return handle_get_contact_enquiries(
            status=arguments.get("status"),
            loan_type=arguments.get("loan_type"),
            limit=_parse_int(arguments.get("limit")) or 20,
            auth_token=auth_token,
            auth_context=auth_user,
        )

    else:
        raise ValueError(f"MCP Tool '{name}' is not recognized.")


def execute_mcp_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    auth_user: Optional[Dict[str, Any]] = None,
    auth_token: Optional[str] = None,
    db: Optional[Any] = None,
) -> Any:
    """
    Dispatches tool execution to the MCP Server over SSE transport, with graceful fallback.
    """
    from core.auth import MCPAuthError

    name = (tool_name or "").strip()
    transport = (settings.MCP_TRANSPORT or "sse").lower()
    logger.info(
        f"⚡ [MCPClient] Executing Tool '{name}' | Transport: {transport.upper()} ({settings.MCP_SERVER_URL}) "
        f"| Role: {auth_user.get('role') if auth_user else 'None'}"
    )

    try:
        if transport == "sse":
            try:
                return _run_async_in_thread(_execute_via_sse(
                    server_url=settings.MCP_SERVER_URL,
                    tool_name=name,
                    arguments=arguments,
                    auth_token=auth_token,
                    auth_user=auth_user,
                ))
            except Exception as sse_err:
                logger.warning(f"⚠️ [MCPClient] Remote SSE call failed ({sse_err}). Falling back to local in-process handler...")
                return _execute_direct(name, arguments, auth_user, auth_token)

        return _execute_direct(name, arguments, auth_user, auth_token)

    except MCPAuthError as e:
        logger.warning(f"🔒 [MCPClient] Authorization failed for '{name}': {e.message}")
        return {"status": "FORBIDDEN", "error": e.message, "statusCode": e.status_code}
    except Exception as e:
        logger.error(f"❌ [MCPClient] Tool execution error for '{name}': {e}", exc_info=True)
        return {"status": "ERROR", "error": str(e)}
