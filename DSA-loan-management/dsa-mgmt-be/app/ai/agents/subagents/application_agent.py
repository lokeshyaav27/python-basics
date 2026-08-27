from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.ai.agents.subagents.base import BaseSubAgent
from app.mcp.tools import (
    GET_LOAN_DOSSIER_SPEC,
    GET_AGENT_DIRECTORY_SPEC,
    GET_COMMISSION_ANALYTICS_SPEC,
    GET_PORTFOLIO_KPIS_SPEC,
    GET_CONTACT_ENQUIRIES_SPEC,
)


class ApplicationOperationsAgent(BaseSubAgent):
    """
    Sub-Agent specialized in loan application dossiers, customer financial profiles,
    agent directory roster, portfolio KPIs, commission analytics, and contact inquiries.
    """

    def __init__(self):
        super().__init__(
            name="ApplicationOperationsAgent",
            description=(
                "Specialist in customer loan dossiers, applicant financial profiles, "
                "team agent directory, portfolio KPIs, commission summaries, and lead enquiries."
            ),
        )
        self.tools_spec = [
            GET_LOAN_DOSSIER_SPEC,
            GET_AGENT_DIRECTORY_SPEC,
            GET_COMMISSION_ANALYTICS_SPEC,
            GET_PORTFOLIO_KPIS_SPEC,
            GET_CONTACT_ENQUIRIES_SPEC,
        ]

    def manage_operations(
        self,
        db: Session,
        query: str,
        application_id: Optional[int] = None,
        auth_user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes operations and dossier lookup.
        """
        role = (auth_user.get("role") or "customer").lower() if auth_user else "customer"

        system_prompt = f"""You are the **Application & Portfolio Operations Specialist Agent**.
Your objective is to fetch loan dossiers, applicant profiles, agent assignments, portfolio performance, and contact enquiries.

### Role Context
- **Caller Role**: {role.upper()}
- **Linked Application ID**: {application_id if application_id else 'None'}

### Operations Instructions
1. For application lookups: Call `get_loan_dossier` with `application_id`.
2. For agent lookups: Call `get_agent_directory`.
3. For portfolio analytics: Call `get_portfolio_kpis` or `get_commission_analytics`.
4. For lead enquiries: Call `get_contact_enquiries`.
5. Keep your summaries clean and organized.
"""
        task_instruction = f"Task: {query}\nApplication ID: {application_id if application_id else 'Not specified'}"

        return self.run_subagent_task(
            db=db,
            system_prompt=system_prompt,
            task_instruction=task_instruction,
            tools_spec=self.tools_spec,
            auth_user=auth_user,
        )
