from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.customer import Customer
from app.models.agent import Agent

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CustomerCreate(BaseModel):
    name: str
    email: str
    mobile: str


class CustomerUpdate(BaseModel):
    name: str
    email: str
    mobile: str


class AssignAgentPayload(BaseModel):
    agentId: Optional[int] = None


def _serialize(c: Customer) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "mobile": c.mobile,
        "uniqueCustomerId": c.uniqueCustomerId,
        "agentId": c.agentId,
        "agentName": c.agent.name if c.agent else None,
        "agentPhoto": c.agent.photo if c.agent else None,
        "status": c.status,
        "isActive": c.isActive,
    }


@router.get("/")
def list_customers(agent_id: Optional[int] = None, include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if not include_inactive:
        query = query.filter(Customer.isActive == True)
    if agent_id is not None:
        query = query.filter(Customer.agentId == agent_id)
    customers = query.all()
    return [_serialize(c) for c in customers]


@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _serialize(c)


@router.post("/")
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    existing = db.query(Customer).filter((Customer.mobile == mobile) | (Customer.email == email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this mobile or email already exists")

    c = Customer(
        name=name,
        email=email,
        mobile=mobile,
        uniqueCustomerId=mobile,
        status="not-started",
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _serialize(c)


@router.put("/{customer_id}")
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    conflict = db.query(Customer).filter(
        ((Customer.mobile == mobile) | (Customer.email == email)),
        Customer.id != customer_id
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Another customer with this mobile or email already exists")

    c.name = name
    c.email = email
    c.mobile = mobile
    db.add(c)
    db.commit()
    db.refresh(c)
    return _serialize(c)


@router.put("/{customer_id}/assign-agent")
def assign_agent(customer_id: int, payload: AssignAgentPayload, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    if payload.agentId is not None:
        agent = db.query(Agent).filter(Agent.id == payload.agentId).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        c.agentId = payload.agentId
    else:
        c.agentId = None

    db.add(c)
    db.commit()
    db.refresh(c)
    return _serialize(c)


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    c.isActive = False
    db.add(c)
    db.commit()
    return {"status": "ok"}
