from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.loan_application import LoanApplication
from app.mcp.auth import check_auth_permission
from app.mcp.serializer import serialize_loan_application


LOAN_TOOLS_SPECS = [
    {
        "name": "get_loan_by_id",
        "description": "Fetches a specific loan application with full underwriting and property/vehicle/personal details by application ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "application_id": {"type": "integer", "description": "Numeric ID of the loan application."}
            },
            "required": ["application_id"]
        }
    },
    {
        "name": "get_all_loans_by_agent_id",
        "description": "Fetches all loan applications assigned to a specific agent.",
        "parameters": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "integer", "description": "ID of the DSA Agent."}
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "get_all_loans",
        "description": "Fetches loan applications with optional filters (role-scoped).",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_identifier": {"type": "string", "description": "Optional mobile, customer ID, or name filter."}
            }
        }
    }
]


def get_loan_by_id(
    db: Session,
    application_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Loan application #{application_id} not found.")

    check_auth_permission(auth_user, target_customer_id=app.uniqueCustomerId, target_agent_id=app.agentId, target_app=app)

    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"
    return serialize_loan_application(app, hide_commission=role == "customer")


def get_all_loans_by_agent_id(
    db: Session,
    agent_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    check_auth_permission(auth_user, target_agent_id=agent_id)

    apps = db.query(LoanApplication).filter(LoanApplication.agentId == agent_id).order_by(LoanApplication.id.desc()).all()
    role = str(auth_user.get("role", "agent")).lower() if auth_user else "agent"
    loans = [serialize_loan_application(a, hide_commission=role == "customer") for a in apps]

    return {
        "agentId": agent_id,
        "totalAssigned": len(loans),
        "loans": loans,
    }


def get_all_loans(
    db: Session,
    customer_identifier: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"
    caller_id = str(auth_user.get("userId") or auth_user.get("user_id") or "").strip()
    caller_ident = str(auth_user.get("identifier") or auth_user.get("mobile") or caller_id).strip()

    query = db.query(LoanApplication)

    if role == "customer":
        search_term = caller_ident or customer_identifier
        if not search_term:
            raise HTTPException(status_code=400, detail="Customer identifier is required.")
        query = query.filter(
            (LoanApplication.uniqueCustomerId == search_term) |
            (LoanApplication.mobile == search_term) |
            (LoanApplication.email.ilike(search_term))
        )
    elif role == "agent":
        if caller_id.isdigit():
            query = query.filter(LoanApplication.agentId == int(caller_id))
        if customer_identifier:
            query = query.filter(
                (LoanApplication.uniqueCustomerId == customer_identifier) |
                (LoanApplication.mobile == customer_identifier) |
                (LoanApplication.name.ilike(f"%{customer_identifier}%"))
            )
    else:
        if customer_identifier:
            query = query.filter(
                (LoanApplication.uniqueCustomerId == customer_identifier) |
                (LoanApplication.mobile == customer_identifier) |
                (LoanApplication.name.ilike(f"%{customer_identifier}%"))
            )

    apps = query.order_by(LoanApplication.id.desc()).all()
    hide_comm = role == "customer"
    loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]

    return {
        "totalLoans": len(loans),
        "loans": loans,
    }
