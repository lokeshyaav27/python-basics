from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.agent import Agent


class AgentRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_agents(self, include_inactive: bool = False) -> List[Agent]:
        query = self.db.query(Agent)
        if not include_inactive:
            query = query.filter(Agent.isActive == True)
        return query.all()

    def get_by_id(self, agent_id: int) -> Optional[Agent]:
        return self.db.query(Agent).filter(Agent.id == agent_id).first()

    def get_by_email(self, email: str, is_admin: Optional[bool] = None) -> Optional[Agent]:
        query = self.db.query(Agent).filter(Agent.email == email)
        if is_admin is not None:
            query = query.filter(Agent.isAdmin == is_admin)
        return query.first()

    def create(
        self,
        name: str,
        email: str,
        mobile: str,
        hashed_password: str,
        is_admin: bool = False,
        photo_filename: Optional[str] = None,
    ) -> Agent:
        agent = Agent(
            name=name,
            email=email,
            mobile=mobile,
            password=hashed_password,
            tempPasswordReset=False,
            isAdmin=is_admin,
            photo=photo_filename,
            isActive=True,
        )
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def update(
        self,
        agent: Agent,
        name: str,
        email: str,
        mobile: str,
        is_admin: Optional[bool] = None,
        is_active: Optional[bool] = None,
        photo_filename: Optional[str] = None,
        update_photo: bool = False,
        hashed_password: Optional[str] = None,
        temp_password_reset: Optional[bool] = None,
    ) -> Agent:
        agent.name = name
        agent.email = email
        agent.mobile = mobile
        if is_admin is not None:
            agent.isAdmin = is_admin
        if is_active is not None:
            agent.isActive = is_active
        if update_photo:
            agent.photo = photo_filename
        if hashed_password is not None:
            agent.password = hashed_password
        if temp_password_reset is not None:
            agent.tempPasswordReset = temp_password_reset
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def soft_delete(self, agent: Agent) -> Agent:
        agent.isActive = False
        self.db.add(agent)
        self.db.commit()
        return agent
