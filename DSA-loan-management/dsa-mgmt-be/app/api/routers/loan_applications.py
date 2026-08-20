from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.session import SessionLocal
from app.repositories.loan_application_repository import LoanApplicationRepository
from app.repositories.agent_repository import AgentRepository
from app.repositories.bank_repository import BankRepository
from app.services.loan_application_service import LoanApplicationService
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_loan_app_service(db: Session = Depends(get_db)) -> LoanApplicationService:
    loan_app_repo = LoanApplicationRepository(db)
    agent_repo = AgentRepository(db)
    bank_repo = BankRepository(db)
    return LoanApplicationService(loan_app_repo, agent_repo, bank_repo)


class LoanApplicationCreate(BaseModel):
    name: str
    email: str
    mobile: str
    productId: Optional[int] = None


class LoanApplicationUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    productId: Optional[int] = None
    clientGeneralDetails: Optional[dict] = None
    homeLoanDetails: Optional[dict] = None
    carLoanDetails: Optional[dict] = None
    personalLoanDetails: Optional[dict] = None


class FullLoanApplicationPayload(BaseModel):
    productId: int
    name: str
    email: str
    mobile: str
    clientGeneralDetails: Optional[dict] = None
    homeLoanDetails: Optional[dict] = None
    carLoanDetails: Optional[dict] = None
    personalLoanDetails: Optional[dict] = None


class AssignAgentPayload(BaseModel):
    agentId: Optional[int] = None


class ApplicationStatusPayload(BaseModel):
    status: Optional[str] = None
    bankId: Optional[int] = None
    description: Optional[str] = None


# ── List Loan Applications (Role-Scoped) ──────────────────────────────────────

@router.get("")
def list_loan_applications(
    agent_id: Optional[int] = None,
    mobile: Optional[str] = None,
    include_inactive: bool = False,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    apps = loan_app_service.list_applications(
        agent_id=agent_id,
        mobile=mobile,
        include_inactive=include_inactive,
        current_user=current_user,
    )
    return success_response(
        result=apps,
        message="Loan applications fetched successfully",
    )


# ── Get Single Loan Application (Ownership Checked) ───────────────────────────

@router.get("/{application_id}")
def get_loan_application(
    application_id: int,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    app = loan_app_service.get_application(application_id, current_user)
    return success_response(
        result=app,
        message="Loan application fetched successfully",
    )


# ── Public Apply Wizard (No Token Required) ───────────────────────────────────

@router.post("/apply")
def submit_full_loan_application(
    payload: FullLoanApplicationPayload,
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    app = loan_app_service.submit_full_loan_application(payload)
    return success_response(
        result=app,
        message="Loan application submitted successfully",
        status_code=201,
    )


# ── Create Quick Application (Admin Only) ─────────────────────────────────────

@router.post("")
def create_loan_application(
    payload: LoanApplicationCreate,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    app = loan_app_service.create_loan_application(payload)
    return success_response(
        result=app,
        message="Loan application created successfully",
        status_code=201,
    )


# ── Update Loan Application (Ownership Checked) ───────────────────────────────

@router.put("/{application_id}")
def update_loan_application(
    application_id: int,
    payload: LoanApplicationUpdate,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    app = loan_app_service.update_loan_application(
        application_id=application_id,
        payload=payload,
        current_user=current_user,
    )
    return success_response(
        result=app,
        message="Loan application updated successfully",
    )


# ── Assign Agent (Admin Only) ─────────────────────────────────────────────────

@router.put("/{application_id}/assign-agent")
def assign_agent(
    application_id: int,
    payload: AssignAgentPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    app = loan_app_service.assign_agent(
        application_id=application_id,
        agent_id=payload.agentId,
    )
    return success_response(
        result=app,
        message="Agent assigned successfully",
    )


# ── Update Status (Admin or Assigned Agent) ───────────────────────────────────

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: ApplicationStatusPayload,
    current_user: CurrentUser = Depends(require_role(["admin", "agent"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    app = loan_app_service.update_application_status(
        application_id=application_id,
        status=payload.status,
        bank_id=payload.bankId,
        description=payload.description,
        current_user=current_user,
    )
    return success_response(
        result=app,
        message=f"Application has been {app['status']} successfully",
    )


# ── Delete Loan Application (Admin Only) ──────────────────────────────────────

@router.delete("/{application_id}")
def delete_loan_application(
    application_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    loan_app_service: LoanApplicationService = Depends(get_loan_app_service),
):
    res = loan_app_service.delete_loan_application(application_id)
    return success_response(
        result=res,
        message="Loan application deactivated successfully",
    )
