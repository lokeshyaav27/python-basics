from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac, MCPAuthError
from app.repositories.loan_application_repository import LoanApplicationRepository


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
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_commission_analytics", user)

    role = user.get("role", "customer")
    caller_id = user.get("userId")

    if role == "customer":
        raise MCPAuthError(
            "Forbidden: Borrowers and customers cannot access internal DSA commission structures.",
            status_code=403,
        )

    scoped_agent_id = agent_id
    if role == "agent" and caller_id is not None:
        scoped_agent_id = int(caller_id)

    with get_db_session() as db:
        repo = LoanApplicationRepository(db)
        result = repo.get_commission_analytics(
            agent_id=scoped_agent_id,
            bank_id=bank_id,
            product_id=product_id,
            status=status,
        )
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
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_portfolio_kpis", user)

    role = user.get("role", "customer")
    caller_id = user.get("userId")

    if role == "customer":
        raise MCPAuthError(
            "Forbidden: Customers cannot access platform portfolio KPIs.",
            status_code=403,
        )

    scoped_agent_id = agent_id
    if role == "agent" and caller_id is not None:
        scoped_agent_id = int(caller_id)

    with get_db_session() as db:
        repo = LoanApplicationRepository(db)
        summary = repo.get_summary(agent_id=scoped_agent_id, product_type=product_type)
        status_counts = repo.get_status_counts(agent_id=scoped_agent_id)

        return {
            "queryType": "portfolio_kpis",
            "role": role,
            "scopedAgentId": scoped_agent_id,
            "productTypeFilter": product_type or "all_products",
            "summary": summary,
            "statusDistribution": status_counts,
        }
