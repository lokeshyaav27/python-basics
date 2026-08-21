from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.loan_application import LoanApplication
from app.mcp.auth import check_auth_permission
from app.mcp.serializer import serialize_loan_application


GET_LOAN_DOSSIER_SPEC = {
    "name": "get_loan_dossier",
    "description": (
        "Unified lookup tool for loan applications and customer dossiers. "
        "Can fetch: (1) a specific loan application with full underwriting and collateral details (pass application_id), "
        "(2) a customer's full profile and loan history (pass customer_id), "
        "(3) an agent's assigned active loan pipeline (pass agent_id), or "
        "(4) general loans matching a search query (pass customer_identifier)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": ["integer", "null"],
                "description": "Specific numeric application ID (e.g. 18).",
            },
            "customer_id": {
                "type": ["string", "null"],
                "description": "Unique customer ID or mobile number to inspect customer history.",
            },
            "agent_id": {
                "type": ["integer", "null"],
                "description": "DSA Agent ID to list their assigned applications (Agent/Admin only).",
            },
            "customer_identifier": {
                "type": ["string", "null"],
                "description": "Optional search term (name, mobile, or email) to search loan applications.",
            },
        },
    },
}

LOAN_TOOLS_SPECS = [GET_LOAN_DOSSIER_SPEC]


def get_loan_dossier(
    db: Session,
    application_id: Optional[int] = None,
    customer_id: Optional[str] = None,
    agent_id: Optional[int] = None,
    customer_identifier: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Unified dossier fetcher handling single application lookups, customer dossiers,
    and agent pipeline queries with RBAC enforcement.
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"
    caller_id = str(auth_user.get("userId") or auth_user.get("user_id") or "").strip() if auth_user else ""
    caller_ident = str(auth_user.get("identifier") or auth_user.get("mobile") or caller_id).strip() if auth_user else ""
    hide_comm = role == "customer"

    # Case 1: Specific Application Lookup
    if application_id is not None and application_id > 0:
        app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail=f"Loan application #{application_id} not found.")

        check_auth_permission(
            auth_user,
            target_customer_id=app.uniqueCustomerId,
            target_agent_id=app.agentId,
            target_app=app,
        )
        return {
            "queryType": "single_application",
            "application": serialize_loan_application(app, hide_commission=hide_comm),
        }

    # Case 2: Agent Assigned Applications Pipeline
    if agent_id is not None and agent_id > 0:
        check_auth_permission(auth_user, target_agent_id=agent_id)
        apps = (
            db.query(LoanApplication)
            .filter(LoanApplication.agentId == agent_id)
            .order_by(LoanApplication.id.desc())
            .all()
        )
        loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]
        return {
            "queryType": "agent_pipeline",
            "agentId": agent_id,
            "totalAssigned": len(loans),
            "applications": loans,
        }

    # Case 3: Customer History & Profile Lookup
    search_cust = (customer_id or "").strip()
    if search_cust:
        check_auth_permission(auth_user, target_customer_id=search_cust)
        query = db.query(LoanApplication).filter(
            (LoanApplication.uniqueCustomerId == search_cust)
            | (LoanApplication.mobile == search_cust)
            | (LoanApplication.email.ilike(search_cust))
        )
        if search_cust.isdigit():
            query = query.union(db.query(LoanApplication).filter(LoanApplication.id == int(search_cust)))

        apps = query.order_by(LoanApplication.id.desc()).all()
        if not apps:
            raise HTTPException(status_code=404, detail=f"No customer dossier or applications found for '{customer_id}'.")

        primary_app = apps[0]
        cgd = primary_app.clientGeneralDetail
        loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]

        return {
            "queryType": "customer_dossier",
            "customerId": primary_app.uniqueCustomerId,
            "name": primary_app.name,
            "email": primary_app.email,
            "mobile": primary_app.mobile,
            "totalApplications": len(loans),
            "latestStatus": primary_app.status or "Lead Created",
            "financialProfile": {
                "monthlyIncome": float(cgd.monthly_income) if (cgd and cgd.monthly_income) else None,
                "cibilScore": cgd.cibil_score if cgd else None,
                "employmentType": cgd.employment_type if cgd else None,
                "location": cgd.location if cgd else None,
            }
            if cgd
            else None,
            "applications": loans,
        }

    # Case 4: General Multi-Loan Query (Scoped by Role)
    query = db.query(LoanApplication)
    search_term = (customer_identifier or "").strip()

    if role == "customer":
        target = caller_ident or search_term
        if not target:
            raise HTTPException(status_code=400, detail="Customer identifier is required.")
        query = query.filter(
            (LoanApplication.uniqueCustomerId == target)
            | (LoanApplication.mobile == target)
            | (LoanApplication.email.ilike(target))
        )
    elif role == "agent":
        if caller_id.isdigit():
            query = query.filter(LoanApplication.agentId == int(caller_id))
        if search_term:
            query = query.filter(
                (LoanApplication.uniqueCustomerId == search_term)
                | (LoanApplication.mobile == search_term)
                | (LoanApplication.name.ilike(f"%{search_term}%"))
            )
    else:  # Admin
        if search_term:
            query = query.filter(
                (LoanApplication.uniqueCustomerId == search_term)
                | (LoanApplication.mobile == search_term)
                | (LoanApplication.name.ilike(f"%{search_term}%"))
            )

    apps = query.order_by(LoanApplication.id.desc()).all()
    loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]

    return {
        "queryType": "application_list",
        "totalApplications": len(loans),
        "applications": loans,
    }

