from typing import Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from dsa_common.repositories import AgentRepository
from dsa_common.repositories import LoanApplicationRepository
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
    CurrentUser,
)


class AuthService:
    def __init__(
        self,
        agent_repo: AgentRepository,
        loan_app_repo: LoanApplicationRepository,
    ):
        self.agent_repo = agent_repo
        self.loan_app_repo = loan_app_repo

    def request_customer_otp(self, mobile: str) -> Dict[str, Any]:
        m = str(mobile).strip()
        if not m:
            raise HTTPException(status_code=400, detail='Mobile number is required')
        return {'mobile': m}

    def verify_customer_otp(self, mobile: str, otp: str) -> Dict[str, Any]:
        m = str(mobile).strip()
        o = str(otp).strip()
        if not m or not o:
            raise HTTPException(status_code=400, detail='Mobile and OTP are required')

        if o != '1234':
            raise HTTPException(status_code=400, detail='Invalid OTP')

        apps = self.loan_app_repo.get_by_customer_mobile(m)
        if not apps:
            raise HTTPException(status_code=404, detail='No customer record found for this mobile number')

        app = apps[0]
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
            'accessToken': access_token,
            'tokenType': 'bearer',
            'user': customer_dict,
        }

    def agent_login(self, email: str, password: str) -> Dict[str, Any]:
        if not email or not password:
            raise HTTPException(status_code=400, detail='Email and password are required')

        e = str(email).strip().lower()
        p = str(password).strip()

        agent = self.agent_repo.get_by_email(e, is_admin=False)
        if not agent or not verify_password(p, agent.password or ''):
            raise HTTPException(status_code=401, detail='Invalid email or password')

        if agent.isActive is False:
            raise HTTPException(status_code=403, detail='Account is deactivated. Please contact administrator.')

        # Upgrade to PBKDF2 hash if legacy plain text password
        if agent.password and not agent.password.startswith("pbkdf2_sha256$"):
            self.agent_repo.update(agent=agent, name=agent.name, email=agent.email, mobile=agent.mobile, hashed_password=hash_password(p))

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
            'accessToken': access_token,
            'tokenType': 'bearer',
            'user': agent_dict,
        }

    def admin_login(self, email: str, password: str) -> Dict[str, Any]:
        if not email or not password:
            raise HTTPException(status_code=400, detail='Email and password are required')

        e = str(email).strip().lower()
        p = str(password).strip()

        agent = self.agent_repo.get_by_email(e, is_admin=True)
        if not agent or not verify_password(p, agent.password or ''):
            raise HTTPException(status_code=401, detail='Invalid admin credentials')

        if agent.isActive is False:
            raise HTTPException(status_code=403, detail='Account is deactivated. Please contact administrator.')

        # Upgrade to PBKDF2 hash if legacy plain text password
        if agent.password and not agent.password.startswith("pbkdf2_sha256$"):
            self.agent_repo.update(agent=agent, name=agent.name, email=agent.email, mobile=agent.mobile, hashed_password=hash_password(p))

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
            'accessToken': access_token,
            'tokenType': 'bearer',
            'user': admin_dict,
        }

    def reset_agent_password(self, agent_id: int, new_password: str) -> None:
        if not new_password or not str(new_password).strip():
            raise HTTPException(status_code=400, detail='newPassword is required')

        agent = self.agent_repo.get_by_id(agent_id)
        if not agent or agent.isAdmin:
            raise HTTPException(status_code=404, detail='Agent not found')

        self.agent_repo.update(
            agent=agent,
            name=agent.name,
            email=agent.email,
            mobile=agent.mobile,
            hashed_password=hash_password(str(new_password).strip()),
            temp_password_reset=True,
        )
