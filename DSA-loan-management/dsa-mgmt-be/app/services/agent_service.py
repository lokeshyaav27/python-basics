from typing import List, Optional, Dict, Any
from fastapi import HTTPException, UploadFile
from app.models.agent import Agent
from app.repositories.agent_repository import AgentRepository
from app.core.security import hash_password, CurrentUser
from app.core.storage import validate_and_save_image, delete_storage_file


class AgentService:
    def __init__(self, agent_repo: AgentRepository):
        self.agent_repo = agent_repo

    @staticmethod
    def serialize_agent(agent: Agent) -> Dict[str, Any]:
        return {
            "id": agent.id,
            "name": agent.name,
            "email": agent.email,
            "mobile": agent.mobile,
            "photo": agent.photo,
            "isAdmin": agent.isAdmin,
            "isActive": agent.isActive,
            "tempPasswordReset": agent.tempPasswordReset,
        }

    def list_agents(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        agents = self.agent_repo.list_agents(include_inactive=include_inactive)
        return [self.serialize_agent(a) for a in agents]

    def get_agent_by_id(self, agent_id: int) -> Dict[str, Any]:
        agent = self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return self.serialize_agent(agent)

    def create_agent(
        self,
        name: str,
        email: str,
        mobile: str,
        password: str,
        is_admin: bool = False,
        file: Optional[UploadFile] = None,
    ) -> Dict[str, Any]:
        existing = self.agent_repo.get_by_email(email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

        photo_fname: Optional[str] = None
        if file is not None and file.filename:
            photo_fname = validate_and_save_image(file, subfolder="agent-photos")

        hashed = hash_password(password.strip())
        agent = self.agent_repo.create(
            name=name,
            email=email,
            mobile=mobile,
            hashed_password=hashed,
            is_admin=is_admin,
            photo_filename=photo_fname,
        )
        return self.serialize_agent(agent)

    def update_agent(
        self,
        agent_id: int,
        name: str,
        email: str,
        mobile: str,
        is_admin: Optional[bool] = None,
        is_active: Optional[bool] = None,
        password: Optional[str] = None,
        file: Optional[UploadFile] = None,
        remove_photo: bool = False,
        current_user: Optional[CurrentUser] = None,
    ) -> Dict[str, Any]:
        agent = self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Check self or admin
        if current_user and not current_user.isAdmin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this agent")

        existing = self.agent_repo.get_by_email(email)
        if existing and existing.id != agent_id:
            raise HTTPException(status_code=400, detail="Email already in use")

        photo_fname = agent.photo
        update_photo = False
        if file is not None and file.filename:
            photo_fname = validate_and_save_image(file, subfolder="agent-photos")
            update_photo = True
        elif remove_photo:
            if agent.photo:
                delete_storage_file(agent.photo, subfolder="agent-photos")
            photo_fname = None
            update_photo = True

        hashed: Optional[str] = None
        temp_reset: Optional[bool] = None
        if password and password.strip():
            hashed = hash_password(password.strip())
            temp_reset = False

        updated = self.agent_repo.update(
            agent=agent,
            name=name,
            email=email,
            mobile=mobile,
            is_admin=is_admin if (current_user and current_user.isAdmin) else None,
            is_active=is_active if (current_user and current_user.isAdmin) else None,
            photo_filename=photo_fname,
            update_photo=update_photo,
            hashed_password=hashed,
            temp_password_reset=temp_reset,
        )
        return self.serialize_agent(updated)

    def toggle_status(self, agent_id: int) -> Dict[str, Any]:
        agent = self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        new_status = not agent.isActive
        updated = self.agent_repo.update(
            agent=agent,
            name=agent.name,
            email=agent.email,
            mobile=agent.mobile,
            is_active=new_status,
        )
        return self.serialize_agent(updated)

    def delete_agent(self, agent_id: int) -> dict:
        agent = self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        self.agent_repo.soft_delete(agent)
        return {"id": agent_id, "deleted": True}
