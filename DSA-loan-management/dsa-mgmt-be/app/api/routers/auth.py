from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from app.db.session import SessionLocal
from app.models.agent import Agent
from app.models.loan_application import LoanApplication

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post('/customer/request-otp')
def request_customer_otp(payload: Dict, db: Session = Depends(get_db)):
    mobile = payload.get('mobile')
    if not mobile:
        raise HTTPException(status_code=400, detail='mobile is required')

    m = str(mobile).strip()
    app = db.query(LoanApplication).filter(
        (LoanApplication.mobile == m) | (LoanApplication.uniqueCustomerId == m)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail='customer not found')

    if app.isActive is False:
        raise HTTPException(status_code=403, detail='Customer account is deactivated. Please contact administrator.')

    # Fixed demo OTP. In production, send via SMS gateway.
    return {'detail': 'otp_sent'}


@router.post('/customer/verify-otp')
def verify_customer_otp(payload: Dict, db: Session = Depends(get_db)):
    mobile = payload.get('mobile')
    otp = payload.get('otp')
    if not mobile or not otp:
        raise HTTPException(status_code=400, detail='mobile and otp are required')
    if str(otp).strip() != '1234':
        raise HTTPException(status_code=400, detail='invalid otp')

    m = str(mobile).strip()
    app = db.query(LoanApplication).filter(
        (LoanApplication.mobile == m) | (LoanApplication.uniqueCustomerId == m)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail='customer not found')

    if app.isActive is False:
        raise HTTPException(status_code=403, detail='Customer account is deactivated. Please contact administrator.')

    return {
        'status': 'ok',
        'customer': {
            'id': app.id,
            'email': app.email,
            'name': app.name,
            'mobile': app.mobile,
            'uniqueCustomerId': app.uniqueCustomerId,
            'isActive': app.isActive,
        }
    }


@router.post('/customer/add')
def add_customer(payload: Dict, db: Session = Depends(get_db)):
    name = str(payload.get('name') or '').strip()
    email = str(payload.get('email') or '').strip()
    mobile = str(payload.get('mobile') or '').strip()
    product_id = payload.get('productId')
    if product_id is not None:
        try:
            product_id = int(product_id)
        except (ValueError, TypeError):
            product_id = None

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail='name, email and mobile are required')

    unique_customer_id = str(payload.get('uniqueCustomerId') or mobile).strip()

    existing = db.query(LoanApplication).filter(
        (LoanApplication.mobile == mobile) | (LoanApplication.uniqueCustomerId == unique_customer_id)
    ).first()

    if existing:
        if existing.isActive is False:
            raise HTTPException(status_code=403, detail='Customer account is deactivated. Please contact administrator.')
        if product_id and not existing.productId:
            existing.productId = product_id
            db.commit()
            db.refresh(existing)
        return {
            'status': 'ok',
            'customer': {
                'id': existing.id,
                'email': existing.email,
                'name': existing.name,
                'mobile': existing.mobile,
                'uniqueCustomerId': existing.uniqueCustomerId,
                'productId': existing.productId,
                'status': existing.status,
                'isActive': existing.isActive,
            },
            'created': False
        }

    new_app = LoanApplication(
        email=email,
        name=name,
        mobile=mobile,
        uniqueCustomerId=unique_customer_id,
        productId=product_id,
        status='not-started',
        isActive=True,
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return {
        'status': 'ok',
        'customer': {
            'id': new_app.id,
            'email': new_app.email,
            'name': new_app.name,
            'mobile': new_app.mobile,
            'uniqueCustomerId': new_app.uniqueCustomerId,
            'productId': new_app.productId,
            'status': new_app.status,
            'isActive': new_app.isActive,
        },
        'created': True
    }


@router.post('/agent-login')
def agent_login(payload: Dict, db: Session = Depends(get_db)):
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='email and password are required')

    e = str(email).strip().lower()
    p = str(password).strip()

    agent = db.query(Agent).filter(
        Agent.email.ilike(e),
        Agent.password == p,
        Agent.isAdmin == False,
    ).first()

    if not agent:
        raise HTTPException(status_code=401, detail='invalid credentials')

    if agent.isActive is False:
        raise HTTPException(status_code=403, detail='Account is deactivated. Please contact administrator.')

    return {
        'status': 'ok',
        'agent': {
            'id': agent.id,
            'name': agent.name,
            'email': agent.email,
            'mobile': agent.mobile,
            'isAdmin': agent.isAdmin,
            'tempPasswordReset': agent.tempPasswordReset,
            'photo': agent.photo,
            'isActive': agent.isActive,
        }
    }


@router.post('/admin-login')
def admin_login(payload: Dict, db: Session = Depends(get_db)):
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='email and password are required')

    e = str(email).strip().lower()
    p = str(password).strip()

    agent = db.query(Agent).filter(
        Agent.email.ilike(e),
        Agent.password == p,
        Agent.isAdmin == True,
    ).first()

    if not agent:
        raise HTTPException(status_code=401, detail='invalid credentials')

    if agent.isActive is False:
        raise HTTPException(status_code=403, detail='Account is deactivated. Please contact administrator.')

    return {
        'status': 'ok',
        'admin': {
            'id': agent.id,
            'name': agent.name,
            'email': agent.email,
            'mobile': agent.mobile,
            'isAdmin': agent.isAdmin,
            'tempPasswordReset': agent.tempPasswordReset,
            'photo': agent.photo,
            'isActive': agent.isActive,
        }
    }


@router.post('/agent/reset-password')
def reset_agent_password(payload: Dict, db: Session = Depends(get_db)):
    agent_id = payload.get('agentId')
    new_password = payload.get('newPassword')
    if not agent_id or not new_password:
        raise HTTPException(status_code=400, detail='agentId and newPassword are required')

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail='Agent not found')

    agent.password = str(new_password).strip()
    agent.tempPasswordReset = True
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return {'status': 'ok', 'message': 'Password reset successfully'}
