from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.loan_application import LoanApplication, Customer
from app.models.agent import Agent
from app.models.bank import Bank
from app.models.product import Product

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class LoanApplicationCreate(BaseModel):
    name: str
    email: str
    mobile: str
    productId: Optional[int] = None


class LoanApplicationUpdate(BaseModel):
    name: str
    email: str
    mobile: str
    productId: Optional[int] = None


class AssignAgentPayload(BaseModel):
    agentId: Optional[int] = None


class ApplicationStatusPayload(BaseModel):
    status: str
    bankId: Optional[int] = None
    description: Optional[str] = None


# Backward compatibility aliases
CustomerCreate = LoanApplicationCreate
CustomerUpdate = LoanApplicationUpdate


def _serialize(app: LoanApplication) -> dict:
    return {
        "id": app.id,
        "name": app.name,
        "email": app.email,
        "mobile": app.mobile,
        "uniqueCustomerId": app.uniqueCustomerId,
        "agentId": app.agentId,
        "agentName": app.agent.name if app.agent else None,
        "agentPhoto": app.agent.photo if app.agent else None,
        "agentMobile": app.agent.mobile if app.agent else None,
        "agentEmail": app.agent.email if app.agent else None,
        "bankId": app.bankId,
        "bankName": app.bank.name if app.bank else None,
        "bankLogo": app.bank.logo if app.bank else None,
        "productId": app.productId,
        "productName": app.product.name if app.product else None,
        "productImage": app.product.image if app.product else None,
        "status": app.status,
        "description": app.description,
        "isActive": app.isActive,
    }


@router.get("/")
def list_loan_applications(
    agent_id: Optional[int] = None,
    mobile: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(LoanApplication)
    if not include_inactive:
        query = query.filter(LoanApplication.isActive != False)
    if agent_id is not None:
        query = query.filter(LoanApplication.agentId == agent_id)
    if mobile is not None and mobile.strip():
        m = mobile.strip()
        query = query.filter((LoanApplication.mobile == m) | (LoanApplication.uniqueCustomerId == m))
    applications = query.all()
    return [_serialize(a) for a in applications]


@router.get("/{application_id}")
def get_loan_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")
    return _serialize(app)


@router.post("/")
def create_loan_application(payload: LoanApplicationCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    existing = db.query(LoanApplication).filter(
        (LoanApplication.mobile == mobile) | (LoanApplication.email == email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An application with this mobile or email already exists")

    app = LoanApplication(
        name=name,
        email=email,
        mobile=mobile,
        uniqueCustomerId=mobile,
        productId=payload.productId,
        status="not-started",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{application_id}")
def update_loan_application(
    application_id: int,
    payload: LoanApplicationUpdate,
    db: Session = Depends(get_db)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    conflict = db.query(LoanApplication).filter(
        ((LoanApplication.mobile == mobile) | (LoanApplication.email == email)),
        LoanApplication.id != application_id
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Another application with this mobile or email already exists")

    app.name = name
    app.email = email
    app.mobile = mobile
    app.productId = payload.productId
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{application_id}/assign-agent")
def assign_agent(
    application_id: int,
    payload: AssignAgentPayload,
    db: Session = Depends(get_db)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    if payload.agentId is not None:
        agent = db.query(Agent).filter(Agent.id == payload.agentId).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        if agent.isActive is False:
            raise HTTPException(status_code=400, detail="Cannot assign a deactivated agent")

    app.agentId = payload.agentId
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: ApplicationStatusPayload,
    db: Session = Depends(get_db)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    status = payload.status.strip().lower()
    if status not in ["not-started", "in-progress", "inprogress", "approved", "rejected", "forwardedtobank"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    if status == "approved":
        if payload.bankId is not None:
            bank = db.query(Bank).filter(Bank.id == payload.bankId).first()
            if not bank:
                raise HTTPException(status_code=404, detail="Selected bank not found")
            app.bankId = payload.bankId
        if payload.description is not None:
            app.description = payload.description.strip() or None
        app.status = "approved"

    elif status == "rejected":
        if not payload.description or not payload.description.strip():
            raise HTTPException(status_code=400, detail="Rejection reason is required")
        app.description = payload.description.strip()
        app.bankId = None
        app.status = "rejected"

    else:
        app.status = status
        if payload.bankId is not None:
            app.bankId = payload.bankId
        if payload.description is not None:
            app.description = payload.description.strip() or None

    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.delete("/{application_id}")
def delete_loan_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    app.isActive = False
    db.add(app)
    db.commit()
    return {"status": "success", "message": "Loan application deactivated successfully"}
