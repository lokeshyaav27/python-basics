from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict
from app.db.session import SessionLocal
from app.repositories.agent_repository import AgentRepository
from app.repositories.loan_application_repository import LoanApplicationRepository
from app.services.auth_service import AuthService
from app.core.security import get_current_user, require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    agent_repo = AgentRepository(db)
    loan_app_repo = LoanApplicationRepository(db)
    return AuthService(agent_repo, loan_app_repo)


@router.post('/customer/request-otp')
def request_customer_otp(payload: Dict, auth_service: AuthService = Depends(get_auth_service)):
    mobile = payload.get('mobile', '')
    res = auth_service.request_customer_otp(mobile)
    return success_response(
        result=res,
        message=f"OTP sent successfully to {res['mobile']}",
    )


@router.post('/customer/verify-otp')
def verify_customer_otp(payload: Dict, auth_service: AuthService = Depends(get_auth_service)):
    mobile = payload.get('mobile', '')
    otp = payload.get('otp', '')
    res = auth_service.verify_customer_otp(mobile, otp)
    return success_response(
        result=res,
        message='Customer verified and logged in successfully',
    )


@router.post('/agent-login')
def agent_login(payload: Dict, auth_service: AuthService = Depends(get_auth_service)):
    email = payload.get('email', '')
    password = payload.get('password', '')
    res = auth_service.agent_login(email, password)
    return success_response(
        result=res,
        message='Agent logged in successfully',
    )


@router.post('/admin-login')
def admin_login(payload: Dict, auth_service: AuthService = Depends(get_auth_service)):
    email = payload.get('email', '')
    password = payload.get('password', '')
    res = auth_service.admin_login(email, password)
    return success_response(
        result=res,
        message='Admin logged in successfully',
    )


@router.get('/me')
def get_authenticated_user_profile(current_user: CurrentUser = Depends(get_current_user)):
    return success_response(
        result=current_user.dict(),
        message="User profile fetched successfully",
    )


@router.post('/agent/reset-password')
def reset_agent_password(
    payload: Dict,
    current_user: CurrentUser = Depends(require_role(["agent"])),
    auth_service: AuthService = Depends(get_auth_service),
):
    new_password = payload.get('newPassword', '')
    auth_service.reset_agent_password(current_user.id, new_password)
    return success_response(
        result=None,
        message='Password reset successfully',
    )
