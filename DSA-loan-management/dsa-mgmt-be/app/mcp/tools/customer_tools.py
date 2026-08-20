from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.loan_application import LoanApplication
from app.mcp.auth import check_auth_permission
from app.mcp.serializer import serialize_loan_application


CUSTOMER_TOOLS_SPECS = [
    {
        "name": "get_customer_details_by_id",
        "description": "Fetches complete customer profile, financials, and application count by customer ID, mobile, or application ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Unique customer ID, mobile number, or primary application ID."}
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "get_loan_details_by_customer_id",
        "description": "Fetches all loan applications associated with a specific customer ID or mobile number.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Unique customer ID or mobile number of the applicant."}
            },
            "required": ["customer_id"]
        }
    }
]


def get_customer_details_by_id(
    db: Session,
    customer_id: str,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    c_id = str(customer_id).strip()
    if not c_id:
        raise HTTPException(status_code=400, detail="customer_id is required.")

    query = db.query(LoanApplication).filter(
        (LoanApplication.uniqueCustomerId == c_id) |
        (LoanApplication.mobile == c_id) |
        (LoanApplication.email.ilike(c_id))
    )
    if c_id.isdigit():
        query = query.union(db.query(LoanApplication).filter(LoanApplication.id == int(c_id)))

    app = query.order_by(LoanApplication.id.desc()).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Customer with identifier '{customer_id}' not found.")

    check_auth_permission(auth_user, target_customer_id=app.uniqueCustomerId, target_app=app)

    total_apps = db.query(LoanApplication).filter(
        (LoanApplication.uniqueCustomerId == app.uniqueCustomerId) | (LoanApplication.mobile == app.mobile)
    ).count()

    cgd = app.clientGeneralDetail
    return {
        "customerId": app.uniqueCustomerId,
        "name": app.name,
        "email": app.email,
        "mobile": app.mobile,
        "latestApplicationId": app.id,
        "totalApplications": total_apps,
        "latestStatus": app.status or "Lead Created",
        "financialProfile": {
            "monthlyIncome": float(cgd.monthly_income) if (cgd and cgd.monthly_income) else None,
            "cibilScore": cgd.cibil_score if cgd else None,
            "employmentType": cgd.employment_type if cgd else None,
            "location": cgd.location if cgd else None,
        } if cgd else None,
    }


def get_loan_details_by_customer_id(
    db: Session,
    customer_id: str,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    c_id = str(customer_id).strip()
    if not c_id:
        raise HTTPException(status_code=400, detail="customer_id is required.")

    check_auth_permission(auth_user, target_customer_id=c_id)

    query = db.query(LoanApplication).filter(
        (LoanApplication.uniqueCustomerId == c_id) |
        (LoanApplication.mobile == c_id) |
        (LoanApplication.email.ilike(c_id))
    )
    if c_id.isdigit():
        query = query.union(db.query(LoanApplication).filter(LoanApplication.id == int(c_id)))

    apps = query.order_by(LoanApplication.id.desc()).all()
    if not apps:
        raise HTTPException(status_code=404, detail=f"No loan applications found for customer '{customer_id}'.")

    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"
    hide_comm = role == "customer"
    loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]

    return {
        "customerId": c_id,
        "totalLoans": len(loans),
        "loans": loans,
    }
