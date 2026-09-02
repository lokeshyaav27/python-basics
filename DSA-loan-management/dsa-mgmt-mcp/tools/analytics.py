import logging
from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac, MCPAuthError
from app.repositories.loan_application_repository import LoanApplicationRepository

logger = logging.getLogger("mcp_tools.analytics")


def handle_get_commission_analytics(
    agent_id: Optional[int] = None,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    status: Optional[str] = None,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calculates and aggregates DSA commission revenue, earned payouts, and pipeline margins.
    Can aggregate: (1) total realized commission from disbursed/approved loans,
    (2) projected pipeline commission, (3) bank-wise commission breakdown,
    (4) agent-wise commission splits (Admin only), or (5) product-wise commissions.
    Restricted to Admin (all platform) and Agent (personal earnings only).
    """
    logger.info(f"🔹 [get_commission_analytics] Filters: AgentId={agent_id}, BankId={bank_id}, ProductId={product_id}, Status={status}")

    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_commission_analytics", user)

    role = user.get("role", "customer")
    caller_id = user.get("userId")

    if role == "customer":
        logger.warning("🔒 [get_commission_analytics] ❌ Blocked: Customer role attempted to view internal commission metrics.")
        raise MCPAuthError(
            "Forbidden: Borrowers and customers cannot access internal DSA commission structures.",
            status_code=403,
        )

    scoped_agent_id = agent_id
    if role == "agent" and caller_id is not None:
        scoped_agent_id = int(caller_id)
        logger.debug(f"ℹ️ [get_commission_analytics] Agent role detected -> Scoping analytics strictly to Agent #{scoped_agent_id}")

    with get_db_session() as db:
        logger.debug("🔍 [get_commission_analytics] Calculating commission totals from LoanApplicationRepository...")
        repo = LoanApplicationRepository(db)
        result = repo.get_commission_analytics(
            agent_id=scoped_agent_id,
            bank_id=bank_id,
            product_id=product_id,
            status=status,
        )
        total_payout = result.get("totalRealizedCommission") or result.get("totalCommission") or 0.0
        logger.info(f"✅ [get_commission_analytics] Analytics aggregated | ScopedAgentId: {scoped_agent_id} | Total: ₹{total_payout:,.2f}")
        return {
            "queryType": "commission_analytics",
            "role": role,
            "scopedAgentId": scoped_agent_id,
            "analytics": result,
        }


def handle_get_portfolio_kpis(
    product_type: Optional[str] = None,
    agent_id: Optional[int] = None,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Retrieves high-level loan portfolio KPIs, status distributions, unique customer counts,
    and volume totals across the DSA lending pipeline. Useful for executive summaries and pipeline health checks.
    """
    logger.info(f"🔹 [get_portfolio_kpis] Filters: ProductType={product_type}, AgentId={agent_id}")

    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_portfolio_kpis", user)

    role = user.get("role", "customer")
    caller_id = user.get("userId")

    if role == "customer":
        logger.warning("🔒 [get_portfolio_kpis] ❌ Blocked: Customer attempted to view portfolio KPIs.")
        raise MCPAuthError(
            "Forbidden: Customers cannot access platform portfolio KPIs.",
            status_code=403,
        )

    scoped_agent_id = agent_id
    if role == "agent" and caller_id is not None:
        scoped_agent_id = int(caller_id)
        logger.debug(f"ℹ️ [get_portfolio_kpis] Agent role detected -> Scoping portfolio KPIs strictly to Agent #{scoped_agent_id}")

    with get_db_session() as db:
        logger.debug("🔍 [get_portfolio_kpis] Fetching pipeline summary and status counts...")
        repo = LoanApplicationRepository(db)
        summary = repo.get_summary(agent_id=scoped_agent_id, product_type=product_type)
        status_counts = repo.get_status_counts(agent_id=scoped_agent_id)

        total_apps = summary.get("totalApplications", 0) if isinstance(summary, dict) else 0
        logger.info(f"✅ [get_portfolio_kpis] Portfolio KPIs retrieved: {total_apps} total applications in scope.")

        return {
            "queryType": "portfolio_kpis",
            "role": role,
            "scopedAgentId": scoped_agent_id,
            "productTypeFilter": product_type or "all_products",
            "summary": summary,
            "statusDistribution": status_counts,
        }
