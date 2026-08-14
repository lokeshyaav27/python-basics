from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict

from app.db.session import SessionLocal
from app.models.agent import Agent

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

    try:
        # use lowercase unquoted column name to match DB (Postgres folds unquoted identifiers to lowercase)
        q = text('SELECT id, email, name, mobile, uniquecustomerid FROM customers WHERE mobile = :mobile')
        row = db.execute(q, {'mobile': mobile}).mappings().fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'db error: {str(e)}')

    if not row:
        raise HTTPException(status_code=404, detail='customer not found')

    # In production, send OTP via SMS. Here we just return success.
    return {'detail': 'otp_sent'}


@router.post('/customer/verify-otp')
def verify_customer_otp(payload: Dict, db: Session = Depends(get_db)):
    mobile = payload.get('mobile')
    otp = payload.get('otp')
    if not mobile or not otp:
        raise HTTPException(status_code=400, detail='mobile and otp are required')
    if str(otp) != '1234':
        raise HTTPException(status_code=400, detail='invalid otp')

    try:
        q = text('SELECT id, email, name, mobile, uniquecustomerid FROM customers WHERE mobile = :mobile')
        row = db.execute(q, {'mobile': mobile}).mappings().fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'db error: {str(e)}')

    if not row:
        raise HTTPException(status_code=404, detail='customer not found')

    return {'status': 'ok', 'customer': dict(row)}


@router.post('/customer/add')
def add_customer(payload: Dict, db: Session = Depends(get_db)):
    name = str(payload.get('name') or '').strip()
    email = str(payload.get('email') or '').strip()
    mobile = str(payload.get('mobile') or '').strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail='name, email and mobile are required')

    unique_customer_id = str(payload.get('uniqueCustomerId') or mobile).strip()

    try:
        existing = db.execute(
            text(
                'SELECT id, email, name, mobile, uniqueCustomerId, status FROM customers WHERE mobile = :mobile OR uniqueCustomerId = :unique_customer_id'
            ),
            {'mobile': mobile, 'unique_customer_id': unique_customer_id},
        ).mappings().fetchone()

        if existing:
            return {'status': 'ok', 'customer': dict(existing), 'created': False}

        db.execute(
            text(
                'INSERT INTO customers (email, name, mobile, uniqueCustomerId, agentid, status) VALUES (:email, :name, :mobile, :unique_customer_id, NULL, :status)'
            ),
            {
                'email': email,
                'name': name,
                'mobile': mobile,
                'unique_customer_id': unique_customer_id,
                'status': 'not-started',
            },
        )
        db.commit()

        row = db.execute(
            text('SELECT id, email, name, mobile, uniqueCustomerId, status FROM customers WHERE mobile = :mobile'),
            {'mobile': mobile},
        ).mappings().fetchone()

        if not row:
            raise HTTPException(status_code=500, detail='customer creation failed')

        return {'status': 'ok', 'customer': dict(row), 'created': True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'db error: {str(e)}')


@router.post('/agent-login')
def agent_login(payload: Dict, db: Session = Depends(get_db)):
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='email and password are required')

    try:
        q = text('SELECT id, name, email, mobile, isadmin, temppasswordreset, photo FROM agents WHERE email = :email AND password = :password AND isadmin = false')
        row = db.execute(q, {'email': email, 'password': password}).mappings().fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'db error: {str(e)}')

    if not row:
        raise HTTPException(status_code=401, detail='invalid credentials')

    return {'status': 'ok', 'agent': dict(row)}


@router.post('/admin-login')
def admin_login(payload: Dict, db: Session = Depends(get_db)):
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='email and password are required')

    try:
        q = text('SELECT id, name, email, mobile, isadmin, temppasswordreset, photo FROM agents WHERE email = :email AND password = :password AND isadmin = true')
        row = db.execute(q, {'email': email, 'password': password}).mappings().fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'db error: {str(e)}')

    if not row:
        raise HTTPException(status_code=401, detail='invalid credentials')

    return {'status': 'ok', 'admin': dict(row)}


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
