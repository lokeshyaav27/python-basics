import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.agent import Agent
from app.models.loan_application import LoanApplication

security = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CurrentUser(BaseModel):
    id: Optional[int] = None
    role: str  # 'admin', 'agent', 'customer'
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    uniqueCustomerId: Optional[str] = None
    isActive: bool = True
    isAdmin: bool = False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Encodes payload dictionary into a signed JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a signed JWT token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[CurrentUser]:
    """
    Optional authentication: returns CurrentUser if Bearer token present & valid, else None.
    """
    if not auth or not auth.credentials:
        return None
    
    payload = decode_access_token(auth.credentials)
    role = payload.get("role", "customer").lower()
    user_id = payload.get("userId") or payload.get("id")

    if role in ["admin", "agent"]:
        if user_id:
            agent = db.query(Agent).filter(Agent.id == int(user_id)).first()
            if agent:
                if agent.isActive is False:
                    raise HTTPException(status_code=403, detail="Account is deactivated.")
                return CurrentUser(
                    id=agent.id,
                    role="admin" if agent.isAdmin else "agent",
                    name=agent.name,
                    email=agent.email,
                    mobile=agent.mobile,
                    isActive=agent.isActive,
                    isAdmin=agent.isAdmin,
                )
    elif role == "customer":
        ident = payload.get("uniqueCustomerId") or payload.get("mobile") or payload.get("sub")
        if ident:
            app = db.query(LoanApplication).filter(
                (LoanApplication.uniqueCustomerId == str(ident)) |
                (LoanApplication.mobile == str(ident)) |
                (LoanApplication.id == (int(user_id) if user_id and str(user_id).isdigit() else -1))
            ).first()
            if app:
                if app.isActive is False:
                    raise HTTPException(status_code=403, detail="Customer account is deactivated.")
                return CurrentUser(
                    id=app.id,
                    role="customer",
                    name=app.name,
                    email=app.email,
                    mobile=app.mobile,
                    uniqueCustomerId=app.uniqueCustomerId,
                    isActive=app.isActive,
                    isAdmin=False,
                )

    return CurrentUser(
        id=user_id,
        role=role,
        name=payload.get("name", "User"),
        email=payload.get("email"),
        mobile=payload.get("mobile"),
        uniqueCustomerId=payload.get("uniqueCustomerId"),
        isActive=True,
        isAdmin=(role == "admin"),
    )


def get_current_user(
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
) -> CurrentUser:
    """
    Mandatory authentication: raises 401 if no valid token provided.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def require_role(allowed_roles: List[str]):
    """
    Role-based authorization dependency guard.
    """
    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Requires one of the following roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker
