from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.agent_repository import AgentRepository
from app.mcp.auth import check_auth_permission


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
                "description": "Optional specific agent ID (e.g. 3) to inspect profile and assigned loans.",
            },
            "include_inactive": {
                "type": ["boolean", "null"],
                "description": "Whether to include deactivated/inactive agents (default: false).",
            },
            "with_workload_metrics": {
                "type": ["boolean", "null"],
                "description": "Whether to include total assigned loan counts, status breakdowns, and requested loan volume per agent (default: true).",
            },
        },
    },
}

AGENT_TOOLS_SPECS = [GET_AGENT_DIRECTORY_SPEC]


def get_agent_directory(
    db: Session,
    agent_id: Optional[int] = None,
    include_inactive: Optional[bool] = False,
    with_workload_metrics: Optional[bool] = True,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches DSA agent roster and workload distribution with RBAC enforcement (Admin only).
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"

    # Strict RBAC: Only Admin can query full agent directories and team metrics
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only Platform Administrators can access the agent directory and team performance metrics.",
        )

    repo = AgentRepository(db)

    if with_workload_metrics is not False:
        agents = repo.get_agent_workload_metrics(
            agent_id=agent_id, include_inactive=bool(include_inactive)
        )
    else:
        raw_agents = (
            [repo.get_by_id(agent_id)]
            if agent_id is not None
            else repo.list_agents(include_inactive=bool(include_inactive))
        )
        agents = [
            {
                "agentId": a.id,
                "name": a.name,
                "email": a.email,
                "mobile": a.mobile,
                "isAdmin": a.isAdmin,
                "isActive": a.isActive,
                "photo": a.photo,
            }
            for a in raw_agents
            if a is not None
        ]

    total_agents = len(agents)
    admin_count = sum(1 for a in agents if a.get("isAdmin"))
    total_loans_across_team = sum(a.get("totalAssignedLoans", 0) for a in agents)
    total_volume_across_team = sum(a.get("totalLoanVolumeRequested", 0.0) for a in agents)

    return {
        "queryType": "agent_directory",
        "totalAgents": total_agents,
        "totalAdmins": admin_count,
        "totalRegularAgents": total_agents - admin_count,
        "totalLoansAcrossTeam": total_loans_across_team,
        "totalLoanVolumeAcrossTeam": round(total_volume_across_team, 2),
        "agents": agents,
    }
