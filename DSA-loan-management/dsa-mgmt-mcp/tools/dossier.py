from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac, enforce_record_ownership
from core.serializer import serialize_loan_application
from app.models.loan_application import LoanApplication


def handle_get_loan_dossier(
    application_id: Optional[int] = None,
    customer_id: Optional[str] = None,
    agent_id: Optional[int] = None,
    customer_identifier: Optional[str] = None,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Unified lookup tool for loan applications and customer dossiers.
    Can fetch: (1) a specific loan application with full underwriting and collateral details (pass application_id),
    (2) a customer's full profile and loan history (pass customer_id),
    (3) an agent's assigned active loan pipeline (pass agent_id), or
    (4) general loans matching a search query (pass customer_identifier).
    """
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_loan_dossier", user)

    role = user.get("role", "customer")
    caller_id = str(user.get("userId") or "")
    caller_ident = str(user.get("identifier") or user.get("mobile") or caller_id).strip().lower()
    hide_comm = role == "customer"

    with get_db_session() as db:
        # Case 1: Specific Application Lookup
        if application_id is not None and int(application_id) > 0:
            app = db.query(LoanApplication).filter(LoanApplication.id == int(application_id)).first()
            if not app:
                raise ValueError(f"Loan application #{application_id} not found.")

            enforce_record_ownership(
                auth_user=user,
                target_customer_id=app.uniqueCustomerId,
                target_agent_id=app.agentId,
                target_app=app,
            )
            return {
                "queryType": "single_application",
                "application": serialize_loan_application(app, hide_commission=hide_comm),
            }

        # Case 2: Agent Assigned Applications Pipeline
        if agent_id is not None and int(agent_id) > 0:
            enforce_record_ownership(auth_user=user, target_agent_id=int(agent_id))
            apps = (
                db.query(LoanApplication)
                .filter(LoanApplication.agentId == int(agent_id))
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
            enforce_record_ownership(auth_user=user, target_customer_id=search_cust)
            query = db.query(LoanApplication).filter(
                (LoanApplication.uniqueCustomerId == search_cust)
                | (LoanApplication.mobile == search_cust)
            )
            if role == "agent" and caller_id:
                query = query.filter(LoanApplication.agentId == int(caller_id))

            apps = query.order_by(LoanApplication.id.desc()).all()
            loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]
            return {
                "queryType": "customer_history",
                "customerId": search_cust,
                "totalApplications": len(loans),
                "applications": loans,
            }

        # Case 4: General Search
        if customer_identifier:
            term = f"%{customer_identifier.strip()}%"
            query = db.query(LoanApplication).filter(
                (LoanApplication.name.ilike(term))
                | (LoanApplication.email.ilike(term))
                | (LoanApplication.mobile.ilike(term))
                | (LoanApplication.uniqueCustomerId.ilike(term))
            )
            if role == "customer" and caller_ident:
                query = query.filter(
                    (LoanApplication.uniqueCustomerId.ilike(caller_ident))
                    | (LoanApplication.mobile.ilike(caller_ident))
                )
            elif role == "agent" and caller_id:
                query = query.filter(LoanApplication.agentId == int(caller_id))

            apps = query.order_by(LoanApplication.id.desc()).limit(10).all()
            loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]
            return {
                "queryType": "search_results",
                "searchTerm": customer_identifier,
                "count": len(loans),
                "applications": loans,
            }

        raise ValueError("Please provide an application_id, customer_id, agent_id, or customer_identifier.")
