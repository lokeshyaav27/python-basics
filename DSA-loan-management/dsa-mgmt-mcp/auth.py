import jwt
import logging
from typing import Dict, Any, Optional, Set
from config import mcp_config

logger = logging.getLogger("mcp_auth")

# Tool Visibility & Role Permissions Mapping
CUSTOMER_PERMITTED_TOOLS: Set[str] = {
    "search_bank_policies",
    "check_loan_eligibility",
    "compare_bank_offers",
    "get_loan_dossier",
    "get_bank_product_catalog",
}

AGENT_PERMITTED_TOOLS: Set[str] = CUSTOMER_PERMITTED_TOOLS | {
    "get_commission_analytics",
    "get_portfolio_kpis",
    "get_contact_enquiries",
}

ADMIN_PERMITTED_TOOLS: Set[str] = AGENT_PERMITTED_TOOLS | {
    "get_agent_directory",
}


class MCPAuthError(Exception):
    """Custom exception raised when MCP authentication or authorization fails."""
    def __init__(self, message: str, status_code: int = 403):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a signed JWT token string using the configured secret key.
    Handles 'Bearer <token>' prefix gracefully.
    """
    if not token:
        return None

    raw_token = token.strip()
    if raw_token.lower().startswith("bearer "):
        raw_token = raw_token[7:].strip()

    try:
        payload = jwt.decode(
            raw_token,
            mcp_config.JWT_SECRET_KEY,
            algorithms=[mcp_config.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise MCPAuthError("Authentication failed: JWT token has expired. Please log in again.", status_code=401)
    except jwt.InvalidTokenError as e:
        raise MCPAuthError(f"Authentication failed: Invalid JWT token ({e}).", status_code=401)
    except Exception as e:
        raise MCPAuthError(f"Authentication failed: {e}", status_code=401)


def resolve_auth_user(
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Resolves the authenticated user context from either a JWT token or an existing context dict.
    Returns a normalized auth user dictionary.
    """
    if auth_context and isinstance(auth_context, dict):
        role = str(auth_context.get("role", "customer")).lower()
        return {
            "userId": auth_context.get("userId") or auth_context.get("id"),
            "role": role,
            "name": auth_context.get("name") or "Agent User",
            "email": auth_context.get("email"),
            "mobile": auth_context.get("mobile"),
            "identifier": auth_context.get("identifier") or auth_context.get("uniqueCustomerId"),
        }

    if auth_token:
        payload = decode_jwt_token(auth_token)
        if payload:
            role = str(payload.get("role", "customer")).lower()
            return {
                "userId": payload.get("userId") or payload.get("id"),
                "role": role,
                "name": payload.get("name") or payload.get("sub") or "Authenticated User",
                "email": payload.get("email"),
                "mobile": payload.get("mobile"),
                "identifier": payload.get("uniqueCustomerId") or payload.get("mobile") or payload.get("sub"),
            }

    # Default fallback: Unauthenticated / public customer context
    return {
        "userId": None,
        "role": "customer",
        "name": "Guest Customer",
        "email": None,
        "mobile": None,
        "identifier": None,
    }


def enforce_tool_rbac(tool_name: str, auth_user: Dict[str, Any]) -> None:
    """
    Enforces Role-Based Access Control (RBAC) on the requested MCP tool.
    Raises MCPAuthError if the caller's role is not permitted to execute the tool.
    """
    role = str(auth_user.get("role", "customer")).lower()

    if role == "admin":
        return  # Admin has unrestricted tool execution access

    if role == "agent":
        if tool_name not in AGENT_PERMITTED_TOOLS:
            raise MCPAuthError(
                f"Forbidden: Role 'agent' is not authorized to execute tool '{tool_name}'. Admin privileges required.",
                status_code=403,
            )
        return

    # Customer role
    if tool_name not in CUSTOMER_PERMITTED_TOOLS:
        raise MCPAuthError(
            f"Forbidden: Role 'customer' is not authorized to execute internal operational tool '{tool_name}'.",
            status_code=403,
        )


def enforce_record_ownership(
    auth_user: Dict[str, Any],
    target_customer_id: Optional[str] = None,
    target_agent_id: Optional[int] = None,
    target_app: Optional[Any] = None,
) -> None:
    """
    Enforces data-level ownership authorization:
    - Customer: Can only view their own loan application or personal profile.
    - Agent: Can only view records assigned to their agent account.
    - Admin: Full unrestricted access.
    """
    role = str(auth_user.get("role", "customer")).lower()
    caller_id = auth_user.get("userId")
    caller_identifier = str(auth_user.get("identifier") or auth_user.get("mobile") or caller_id or "").strip().lower()

    if role == "admin":
        return

    if role == "agent":
        if target_agent_id is not None and caller_id is not None:
            if int(target_agent_id) != int(caller_id):
                raise MCPAuthError(
                    "Forbidden: Agents can only access data assigned to their own agent account.",
                    status_code=403,
                )
        if target_app is not None and caller_id is not None:
            app_agent_id = getattr(target_app, "agentId", None)
            if app_agent_id is not None and int(app_agent_id) != int(caller_id):
                raise MCPAuthError(
                    "Forbidden: This loan application is assigned to another agent.",
                    status_code=403,
                )
        return

    if role == "customer":
        if target_agent_id is not None and target_app is None:
            raise MCPAuthError(
                "Forbidden: Customers cannot access internal agent performance records.",
                status_code=403,
            )

        if target_customer_id and target_app is None:
            cleaned_target = str(target_customer_id).strip().lower()
            if caller_identifier and (cleaned_target != caller_identifier and str(caller_id) != cleaned_target):
                raise MCPAuthError(
                    "Forbidden: Customers cannot access other borrowers' loan records.",
                    status_code=403,
                )

        if target_app is not None and caller_identifier:
            app_cust_id = str(getattr(target_app, "uniqueCustomerId", "") or "").strip().lower()
            app_mobile = str(getattr(target_app, "mobile", "") or "").strip().lower()
            app_id_str = str(getattr(target_app, "id", ""))

            is_owner = (
                caller_identifier in [app_cust_id, app_mobile, app_id_str]
                or str(caller_id) in [app_cust_id, app_mobile, app_id_str]
            )
            if not is_owner:
                raise MCPAuthError(
                    "Forbidden: You can only access your own loan application.",
                    status_code=403,
                )
