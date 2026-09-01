from typing import Dict, Any, Optional
from db import get_db_session
from auth import resolve_auth_user, enforce_tool_rbac, MCPAuthError
from app.repositories.agent_repository import AgentRepository


def handle_get_agent_directory(
    agent_id: Optional[int] = None,
    include_inactive: Optional[bool] = False,
    with_workload_metrics: Optional[bool] = True,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Directory lookup tool for DSA loan agents, administrators, and team performance metrics.
    Allows fetching: (1) full list of agents with assigned loan counts and volume (pass with_workload_metrics=true),
    (2) detailed profile for a specific agent (pass agent_id), or
    (3) active/inactive agent roster. Restricted to Administrator role only.
    """
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_agent_directory", user)

    role = user.get("role", "customer")
    if role != "admin":
        raise MCPAuthError(
            "Forbidden: Only Platform Administrators can access the agent directory and team performance metrics.",
            status_code=403,
        )

    with get_db_session() as db:
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
