from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.contact_repository import ContactRepository


GET_CONTACT_ENQUIRIES_SPEC = {
    "name": "get_contact_enquiries",
    "description": (
        "Fetches customer lead enquiries submitted through the public website contact form. "
        "Allows filtering by status ('New', 'In-Progress', 'Resolved', 'all') and loan type ('Home Loan', 'Car Loan', 'Personal Loan'). "
        "Restricted to Admin and Agent roles."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "status": {
                "type": ["string", "null"],
                "description": "Status filter: 'New', 'In-Progress', 'Resolved', or 'all' (default: 'all').",
            },
            "loan_type": {
                "type": ["string", "null"],
                "description": "Product type filter: 'Home Loan', 'Car Loan', 'Personal Loan', or 'all'.",
            },
            "limit": {
                "type": ["integer", "null"],
                "description": "Maximum number of records to return (default: 20).",
            },
        },
    },
}

ENQUIRY_TOOLS_SPECS = [GET_CONTACT_ENQUIRIES_SPEC]


def get_contact_enquiries(
    db: Session,
    status: Optional[str] = None,
    loan_type: Optional[str] = None,
    limit: Optional[int] = 20,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches contact enquiries with RBAC enforcement (Admin & Agent only).
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"

    if role == "customer":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only DSA staff and administrators can view customer contact enquiries.",
        )

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
