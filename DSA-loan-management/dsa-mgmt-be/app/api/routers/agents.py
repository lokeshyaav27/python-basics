from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.repositories.agent_repository import AgentRepository
from app.services.agent_service import AgentService
from app.core.security import require_role, get_current_user, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_agent_service(db: Session = Depends(get_db)) -> AgentService:
    repo = AgentRepository(db)
    return AgentService(repo)


@router.get("")
def list_agents(
    include_inactive: bool = False,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    agents = agent_service.list_agents(include_inactive=include_inactive)
    return success_response(
        result=agents,
        message="Agents fetched successfully",
    )


@router.get("/me")
def get_current_agent_profile(
    current_user: CurrentUser = Depends(require_role(["admin", "agent"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    agent = agent_service.get_agent_by_id(current_user.id)
    return success_response(
        result=agent,
        message="Agent profile fetched successfully",
    )


@router.get("/{agent_id}")
def get_agent(
    agent_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    agent = agent_service.get_agent_by_id(agent_id)
    return success_response(
        result=agent,
        message="Agent fetched successfully",
    )


@router.post("")
def create_agent(
    name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    password: str = Form(...),
    isAdmin: bool = Form(False),
    file: UploadFile | None = File(None),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    agent = agent_service.create_agent(
        name=name,
        email=email,
        mobile=mobile,
        password=password,
        is_admin=isAdmin,
        file=file,
    )
    return success_response(
        result=agent,
        message="Agent created successfully",
        status_code=201,
    )


@router.put("/{agent_id}")
def update_agent(
    agent_id: int,
    name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    isAdmin: bool | None = Form(None),
    isActive: bool | None = Form(None),
    password: str | None = Form(None),
    file: UploadFile | None = File(None),
    remove_photo: bool = Form(False),
    current_user: CurrentUser = Depends(require_role(["admin", "agent"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    agent = agent_service.update_agent(
        agent_id=agent_id,
        name=name,
        email=email,
        mobile=mobile,
        is_admin=isAdmin,
        is_active=isActive,
        password=password,
        file=file,
        remove_photo=remove_photo,
        current_user=current_user,
    )
    return success_response(
        result=agent,
        message="Agent updated successfully",
    )


@router.put("/{agent_id}/toggle-status")
def toggle_agent_status(
    agent_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    agent = agent_service.toggle_status(agent_id)
    status_str = "activated" if agent["isActive"] else "deactivated"
    return success_response(
        result=agent,
        message=f"Agent {status_str} successfully",
    )


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    agent_service: AgentService = Depends(get_agent_service),
):
    res = agent_service.delete_agent(agent_id)
    return success_response(
        result=res,
        message="Agent deactivated successfully",
    )
