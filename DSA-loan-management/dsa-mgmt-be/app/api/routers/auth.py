from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict

from app.db.session import SessionLocal

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


@router.post('/agent-login')
def agent_login(payload: Dict, db: Session = Depends(get_db)):
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='email and password are required')

    try:
        q = text('SELECT id, name, email, mobile, isadmin FROM agents WHERE email = :email AND password = :password AND isadmin = false')
        row = db.execute(q, {'email': email, 'password': password}).mappings().fetchone()
    except Exception:
        raise HTTPException(status_code=500, detail='db error')

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
        q = text('SELECT id, name, email, mobile, isadmin FROM agents WHERE email = :email AND password = :password AND isadmin = true')
        row = db.execute(q, {'email': email, 'password': password}).mappings().fetchone()
    except Exception:
        raise HTTPException(status_code=500, detail='db error')

    if not row:
        raise HTTPException(status_code=401, detail='invalid credentials')

    return {'status': 'ok', 'admin': dict(row)}
