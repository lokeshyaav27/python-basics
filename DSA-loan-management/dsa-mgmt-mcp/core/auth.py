import jwt
import logging
from typing import Dict, Any, Optional, Set
from core.config import mcp_config

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
        logger.debug("🔒 [Auth] No JWT token provided.")
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
        logger.debug(f"🔒 [Auth] JWT successfully decoded | Subject: {payload.get('sub')} | Role: {payload.get('role')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("🔒 [Auth] Token signature has EXPIRED.")
        raise MCPAuthError("Authentication failed: JWT token has expired. Please log in again.", status_code=401)
    except jwt.InvalidTokenError as e:
        logger.warning(f"🔒 [Auth] Invalid JWT token: {e}")
        raise MCPAuthError(f"Authentication failed: Invalid JWT token ({e}).", status_code=401)
    except Exception as e:
        logger.error(f"🔒 [Auth] Unexpected JWT decode error: {e}")
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
        user = {
            "userId": auth_context.get("userId") or auth_context.get("id"),
            "role": role,
            "name": auth_context.get("name") or "Context User",
            "email": auth_context.get("email"),
            "mobile": auth_context.get("mobile"),
            "identifier": auth_context.get("identifier") or auth_context.get("uniqueCustomerId"),
        }
        logger.info(f"👤 [Auth] Resolved identity via auth_context -> Role: '{user['role']}', UserId: {user['userId']}, Name: '{user['name']}'")
        return user

    if auth_token:
        payload = decode_jwt_token(auth_token)
        if payload:
            role = str(payload.get("role", "customer")).lower()
            user = {
                "userId": payload.get("userId") or payload.get("id"),
                "role": role,
                "name": payload.get("name") or payload.get("sub") or "Authenticated User",
                "email": payload.get("email"),
                "mobile": payload.get("mobile"),
                "identifier": payload.get("uniqueCustomerId") or payload.get("mobile") or payload.get("sub"),
            }
            logger.info(f"👤 [Auth] Resolved identity via JWT token -> Role: '{user['role']}', UserId: {user['userId']}, Name: '{user['name']}'")
            return user

    # Default fallback: Unauthenticated / public customer context
    logger.info("👤 [Auth] No credentials provided -> Defaulting to Guest Customer context.")
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
    user_id = auth_user.get("userId")

    logger.debug(f"🛡️ [RBAC Check] Tool: '{tool_name}' | Caller: Role='{role}', UserId={user_id}")

    if role == "admin":
        logger.debug(f"🛡️ [RBAC Check] ✅ Granted: Role 'admin' has full platform access to tool '{tool_name}'.")
        return

    if role == "agent":
        if tool_name not in AGENT_PERMITTED_TOOLS:
            logger.warning(f"🛡️ [RBAC Check] ❌ DENIED: Role 'agent' attempted to run admin-only tool '{tool_name}'.")
            raise MCPAuthError(
                f"Forbidden: Role 'agent' is not authorized to execute tool '{tool_name}'. Admin privileges required.",
                status_code=403,
            )
        logger.debug(f"🛡️ [RBAC Check] ✅ Granted: Tool '{tool_name}' permitted for role 'agent'.")
        return

    # Customer role
    if tool_name not in CUSTOMER_PERMITTED_TOOLS:
        logger.warning(f"🛡️ [RBAC Check] ❌ DENIED: Role 'customer' attempted to run internal staff tool '{tool_name}'.")
        raise MCPAuthError(
            f"Forbidden: Role 'customer' is not authorized to execute internal operational tool '{tool_name}'.",
            status_code=403,
        )
    logger.debug(f"🛡️ [RBAC Check] ✅ Granted: Tool '{tool_name}' permitted for role 'customer'.")


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

    logger.debug(
        f"🔐 [Ownership Check] Checking ownership for Role='{role}', CallerId={caller_id}, "
        f"TargetCust='{target_customer_id}', TargetAgent='{target_agent_id}', TargetAppId='{getattr(target_app, 'id', None)}'"
    )

    if role == "admin":
        logger.debug("🔐 [Ownership Check] ✅ Granted: Admin role has unrestricted data access.")
        return

    if role == "agent":
        if target_agent_id is not None and caller_id is not None:
            if int(target_agent_id) != int(caller_id):
                logger.warning(f"🔐 [Ownership Check] ❌ DENIED: Agent {caller_id} tried accessing data for Agent {target_agent_id}.")
                raise MCPAuthError(
                    "Forbidden: Agents can only access data assigned to their own agent account.",
                    status_code=403,
                )
        if target_app is not None and caller_id is not None:
            app_agent_id = getattr(target_app, "agentId", None)
            if app_agent_id is not None and int(app_agent_id) != int(caller_id):
                logger.warning(f"🔐 [Ownership Check] ❌ DENIED: Agent {caller_id} tried accessing App #{target_app.id} assigned to Agent {app_agent_id}.")
                raise MCPAuthError(
                    "Forbidden: This loan application is assigned to another agent.",
                    status_code=403,
                )
        logger.debug("🔐 [Ownership Check] ✅ Granted: Agent owns target record.")
        return

    if role == "customer":
        if target_agent_id is not None and target_app is None:
            logger.warning(f"🔐 [Ownership Check] ❌ DENIED: Customer attempted to access agent workload metrics.")
            raise MCPAuthError(
                "Forbidden: Customers cannot access internal agent performance records.",
                status_code=403,
            )

        if target_customer_id and target_app is None:
            cleaned_target = str(target_customer_id).strip().lower()
            if caller_identifier and (cleaned_target != caller_identifier and str(caller_id) != cleaned_target):
                logger.warning(f"🔐 [Ownership Check] ❌ DENIED: Customer {caller_identifier} tried accessing data for customer {cleaned_target}.")
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
                logger.warning(f"🔐 [Ownership Check] ❌ DENIED: Customer {caller_identifier} tried accessing App #{target_app.id} (Owner: {app_cust_id}/{app_mobile}).")
                raise MCPAuthError(
                    "Forbidden: You can only access your own loan application.",
                    status_code=403,
                )
        logger.debug("🔐 [Ownership Check] ✅ Granted: Customer owns target record.")
