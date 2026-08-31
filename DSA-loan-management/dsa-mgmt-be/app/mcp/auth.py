from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.models.loan_application import LoanApplication


def check_auth_permission(
    auth_user: Optional[Dict[str, Any]],
    target_customer_id: Optional[str] = None,
    target_agent_id: Optional[int] = None,
    target_app: Optional[LoanApplication] = None,
) -> None:
    """
    Validates role-based access control for MCP tool execution:
    - Admin: Full access.
    - Agent: Can access resources assigned to or associated with their agent_id.
    - Customer: Can access ONLY their own records.
    """
    if not auth_user:
        return

    role = str(auth_user.get("role", "customer")).lower()
    caller_user_id = auth_user.get("userId") or auth_user.get("user_id") or auth_user.get("id")
    caller_identifier = str(auth_user.get("identifier") or auth_user.get("mobile") or caller_user_id or "").strip().lower()

    if role == "admin":
        return  # Admin has unrestricted access

    if role == "agent":
        if target_agent_id is not None and caller_user_id is not None:
            if int(target_agent_id) != int(caller_user_id):
                raise HTTPException(status_code=403, detail="Forbidden: You can only access resources assigned to your agent account.")
        if target_app is not None and caller_user_id is not None:
            if target_app.agentId is not None and int(target_app.agentId) != int(caller_user_id):
                raise HTTPException(status_code=403, detail="Forbidden: This loan application is assigned to another agent.")
        return

    if role == "customer":
        if target_agent_id is not None and target_app is None:
            raise HTTPException(status_code=403, detail="Forbidden: Customers cannot access internal agent records.")

        if target_customer_id and target_app is None:
            cleaned_target = str(target_customer_id).strip().lower()
            if cleaned_target != caller_identifier and str(caller_user_id) != cleaned_target:
                raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view other customer records.")

        if target_app is not None:
            app_cust_id = str(target_app.uniqueCustomerId or "").strip().lower()
            app_mobile = str(target_app.mobile or "").strip().lower()
            app_id_str = str(target_app.id)

            is_owner = (
                caller_identifier in [app_cust_id, app_mobile, app_id_str]
                or str(caller_user_id) in [app_cust_id, app_mobile, app_id_str]
            )
            if not is_owner:
                raise HTTPException(status_code=403, detail="Forbidden: You can only access your own loan application.")
