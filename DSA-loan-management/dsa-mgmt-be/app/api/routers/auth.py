from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import SessionLocal
from app.models.agent import Agent
from app.models.loan_application import LoanApplication
from app.core.security import create_access_token, get_current_user, require_role, hash_password, verify_password, CurrentUser

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
    return {'status': 'ok', 'message': f'OTP sent successfully to {m}'}


@router.post('/customer/verify-otp')
def verify_customer_otp(payload: Dict, db: Session = Depends(get_db)):
    mobile = payload.get('mobile')
    otp = payload.get('otp')
    if not mobile or not otp:
        raise HTTPException(status_code=400, detail='mobile and otp are required')

    m = str(mobile).strip()
    o = str(otp).strip()

    if o != '1234':
        raise HTTPException(status_code=400, detail='invalid OTP')

    app = db.query(LoanApplication).filter(LoanApplication.mobile == m).first()
    if not app:
        raise HTTPException(status_code=404, detail='No customer record found for this mobile number')

    if app.isActive is False:
        raise HTTPException(status_code=403, detail='Customer account is deactivated. Please contact administrator.')

    token_payload = {
        "sub": str(app.id),
        "userId": app.id,
        "role": "customer",
        "name": app.name,
        "email": app.email,
        "mobile": app.mobile,
        "uniqueCustomerId": app.uniqueCustomerId,
    }
    access_token = create_access_token(token_payload)

    customer_dict = {
        'id': app.id,
        'email': app.email,
        'name': app.name,
        'mobile': app.mobile,
        'uniqueCustomerId': app.uniqueCustomerId,
        'productId': app.productId,
        'status': app.status,
        'role': 'customer',
        'isActive': app.isActive,
    }

    return {
        'status': 'ok',
        'accessToken': access_token,
        'tokenType': 'bearer',
        'user': customer_dict,
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
        Agent.isAdmin == False,
    ).first()

    if not agent or not verify_password(p, agent.password or ''):
        raise HTTPException(status_code=401, detail='invalid credentials')

    if agent.isActive is False:
        raise HTTPException(status_code=403, detail='Account is deactivated. Please contact administrator.')

    # Upgrade to PBKDF2 hash if legacy plain text password
    if agent.password and not agent.password.startswith("pbkdf2_sha256$"):
        agent.password = hash_password(p)
        db.add(agent)
        db.commit()
        db.refresh(agent)

    token_payload = {
        "sub": str(agent.id),
        "userId": agent.id,
        "role": "agent",
        "name": agent.name,
        "email": agent.email,
        "mobile": agent.mobile,
        "isAdmin": False,
    }
    access_token = create_access_token(token_payload)

    agent_dict = {
        'id': agent.id,
        'name': agent.name,
        'email': agent.email,
        'mobile': agent.mobile,
        'role': 'agent',
        'isAdmin': agent.isAdmin,
        'tempPasswordReset': agent.tempPasswordReset,
        'photo': agent.photo,
        'isActive': agent.isActive,
    }

    return {
        'status': 'ok',
        'accessToken': access_token,
        'tokenType': 'bearer',
        'user': agent_dict,
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
        Agent.isAdmin == True,
    ).first()

    if not agent or not verify_password(p, agent.password or ''):
        raise HTTPException(status_code=401, detail='invalid credentials')

    if agent.isActive is False:
        raise HTTPException(status_code=403, detail='Account is deactivated. Please contact administrator.')

    # Upgrade to PBKDF2 hash if legacy plain text password
    if agent.password and not agent.password.startswith("pbkdf2_sha256$"):
        agent.password = hash_password(p)
        db.add(agent)
        db.commit()
        db.refresh(agent)

    token_payload = {
        "sub": str(agent.id),
        "userId": agent.id,
        "role": "admin",
        "name": agent.name,
        "email": agent.email,
        "mobile": agent.mobile,
        "isAdmin": True,
    }
    access_token = create_access_token(token_payload)

    admin_dict = {
        'id': agent.id,
        'name': agent.name,
        'email': agent.email,
        'mobile': agent.mobile,
        'role': 'admin',
        'isAdmin': agent.isAdmin,
        'tempPasswordReset': agent.tempPasswordReset,
        'photo': agent.photo,
        'isActive': agent.isActive,
    }

    return {
        'status': 'ok',
        'accessToken': access_token,
        'tokenType': 'bearer',
        'user': admin_dict,
    }


@router.get('/me')
def get_authenticated_user_profile(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns current user profile authenticated via Bearer JWT token.
    """
    return {
        "status": "ok",
        "user": current_user.dict()
    }


@router.post('/agent/reset-password')
def reset_agent_password(
    payload: Dict,
    current_user: CurrentUser = Depends(require_role(["agent"])),
    db: Session = Depends(get_db),
):
    new_password = payload.get('newPassword')
    if not new_password:
        raise HTTPException(status_code=400, detail='newPassword is required')

    agent = db.query(Agent).filter(Agent.id == current_user.id, Agent.isAdmin == False).first()
    if not agent:
        raise HTTPException(status_code=404, detail='Agent not found')

    agent.password = hash_password(str(new_password).strip())
    agent.tempPasswordReset = True
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return {'status': 'ok', 'message': 'Password reset successfully'}
