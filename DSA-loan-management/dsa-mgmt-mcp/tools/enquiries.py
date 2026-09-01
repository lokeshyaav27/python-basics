from typing import Dict, Any, Optional
from db import get_db_session
from auth import resolve_auth_user, enforce_tool_rbac, MCPAuthError
from app.repositories.contact_repository import ContactRepository


def handle_get_contact_enquiries(
    status: Optional[str] = None,
    loan_type: Optional[str] = None,
    limit: Optional[int] = 20,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches customer lead enquiries submitted through the public website contact form.
    Allows filtering by status ('New', 'In-Progress', 'Resolved', 'all') and loan type ('Home Loan', 'Car Loan', 'Personal Loan').
    Restricted to Admin and Agent roles.
    """
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_contact_enquiries", user)

    role = user.get("role", "customer")
    if role == "customer":
        raise MCPAuthError(
            "Forbidden: Only DSA staff and administrators can view customer contact enquiries.",
            status_code=403,
        )

    with get_db_session() as db:
        repo = ContactRepository(db)
        enquiries = repo.list_enquiries_filtered(
            status=status,
            loan_type=loan_type,
            limit=int(limit) if limit else 20,
        )

        items = [
            {
                "id": e.id,
                "name": e.name,
                "email": e.email,
                "mobile": e.mobile,
                "loanType": e.loanType,
                "message": e.message,
                "status": e.status,
                "adminComment": e.adminComment,
                "createdAt": e.createdAt.isoformat() if e.createdAt else None,
            }
            for e in enquiries
        ]

        return {
            "queryType": "contact_enquiries",
            "totalFound": len(items),
            "enquiries": items,
        }
