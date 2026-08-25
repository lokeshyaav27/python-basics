from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.loan_application_repository import LoanApplicationRepository
from app.mcp.auth import check_auth_permission


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
                "description": "Optional specific agent ID to calculate earnings for (Admin only; Agents automatically scoped to self).",
            },
            "bank_id": {
                "type": ["integer", "null"],
                "description": "Optional partner bank ID to filter commissions generated through that bank.",
            },
            "product_id": {
                "type": ["integer", "null"],
                "description": "Optional product ID (e.g. Home, Car, Personal Loan) to filter commission earnings.",
            },
            "status": {
                "type": ["string", "null"],
                "description": "Optional status filter (e.g. 'Disbursed', 'Approved', 'Pending Review', or 'all').",
            },
        },
    },
}

GET_PORTFOLIO_KPIS_SPEC = {
    "name": "get_portfolio_kpis",
    "description": (
        "Retrieves high-level loan portfolio KPIs, status distributions, unique customer counts, "
        "and volume totals across the DSA lending pipeline. Useful for executive summaries and pipeline health checks."
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
                "description": "Optional agent ID filter (Admin only; Agents automatically scoped to self).",
            },
        },
    },
}

ANALYTICS_TOOLS_SPECS = [
    GET_COMMISSION_ANALYTICS_SPEC,
    GET_PORTFOLIO_KPIS_SPEC,
]


def get_commission_analytics(
    db: Session,
    agent_id: Optional[int] = None,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    status: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Computes earned & projected DSA commission analytics with RBAC enforcement.
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"
    caller_id = auth_user.get("userId") or auth_user.get("user_id") or auth_user.get("id")

    # Strict RBAC: Customers can NEVER see commissions
    if role == "customer":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Borrowers and customers cannot access internal DSA commission structures.",
        )

    # Agents are strictly scoped to their own loans
    scoped_agent_id = agent_id
    if role == "agent":
        if caller_id is not None:
            scoped_agent_id = int(caller_id)

    repo = LoanApplicationRepository(db)
    result = repo.get_commission_analytics(
        agent_id=scoped_agent_id,
        bank_id=bank_id,
        product_id=product_id,
        status=status,
    )

    # If Agent role, hide agent-wise breakdown of other agents
    if role == "agent":
        result["agentBreakdown"] = [
            ab for ab in result.get("agentBreakdown", [])
            if caller_id is not None and str(caller_id) in str(ab.get("agentName", ""))
        ]

    result["queryType"] = "commission_analytics"
    result["userRole"] = role.upper()
    return result


def get_portfolio_kpis(
    db: Session,
    product_type: Optional[str] = None,
    agent_id: Optional[int] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Retrieves overall portfolio KPI distribution and conversion figures with RBAC scoping.
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"
    caller_id = auth_user.get("userId") or auth_user.get("user_id") or auth_user.get("id")

    scoped_agent_id = agent_id
    if role == "agent" and caller_id is not None:
        scoped_agent_id = int(caller_id)
    elif role == "customer":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Portfolio KPIs are reserved for DSA staff and administration.",
        )

    repo = LoanApplicationRepository(db)
    kpis = repo.get_portfolio_kpis(product_type=product_type, agent_id=scoped_agent_id)
    kpis["queryType"] = "portfolio_kpis"
    kpis["userRole"] = role.upper()
    return kpis
