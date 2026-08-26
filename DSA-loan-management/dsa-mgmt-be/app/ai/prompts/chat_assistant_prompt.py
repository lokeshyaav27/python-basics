from typing import Optional, Dict, Any
from app.ai.prompts.admin_prompt import build_admin_chat_prompt
from app.ai.prompts.agent_prompt import build_agent_chat_prompt
from app.ai.prompts.customer_prompt import build_customer_chat_prompt


def build_chat_assistant_prompt(
    auth_context: Optional[Dict[str, Any]],
    linked_app_id: Optional[int] = None,
    linked_cust_id: Optional[str] = None,
    linked_agent_id: Optional[int] = None,
) -> str:
    """
    Dispatcher function that routes to the appropriate role-dedicated system prompt:
    - Admin: build_admin_chat_prompt (Executive supervision, team rosters, commission analytics)
    - Agent: build_agent_chat_prompt (Commercial co-pilot, higher payouts, pipeline tracking)
    - Customer: build_customer_chat_prompt (Borrower guidance, lowest EMI/rates, eligibility)
    """
    role = (auth_context.get("role") if auth_context else "customer").lower()

    if role == "admin":
        return build_admin_chat_prompt(
            auth_context=auth_context,
            linked_app_id=linked_app_id,
            linked_cust_id=linked_cust_id,
            linked_agent_id=linked_agent_id,
        )
    elif role == "agent":
        return build_agent_chat_prompt(
            auth_context=auth_context,
            linked_app_id=linked_app_id,
            linked_cust_id=linked_cust_id,
            linked_agent_id=linked_agent_id,
        )
    else:
        return build_customer_chat_prompt(
            auth_context=auth_context,
            linked_app_id=linked_app_id,
            linked_cust_id=linked_cust_id,
            linked_agent_id=linked_agent_id,
        )


# Backward-compatible alias
build_system_prompt = build_chat_assistant_prompt
