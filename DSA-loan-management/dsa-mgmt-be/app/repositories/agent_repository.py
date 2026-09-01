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

    def get_agent_workload_metrics(
        self, agent_id: Optional[int] = None, include_inactive: bool = False
    ) -> List[dict]:
        from app.models.loan_application import LoanApplication
        from app.models.client_general_detail import ClientGeneralDetail

        query = self.db.query(Agent)
        if not include_inactive:
            query = query.filter(Agent.isActive == True)
        if agent_id is not None:
            query = query.filter(Agent.id == agent_id)

        agents = query.order_by(Agent.id.asc()).all()
        results = []

        for a in agents:
            apps = (
                self.db.query(LoanApplication)
                .filter(LoanApplication.agentId == a.id, LoanApplication.isActive != False)
                .all()
            )

            total_count = len(apps)
            status_counts = {}
            total_volume = 0.0

            for app in apps:
                st = app.status or "Lead Created"
                status_counts[st] = status_counts.get(st, 0) + 1
                loan_amt = 0.0
                if app.homeLoanDetail and app.homeLoanDetail.loan_amount_required is not None:
                    try:
                        loan_amt = float(app.homeLoanDetail.loan_amount_required)
                    except (ValueError, TypeError):
                        loan_amt = 0.0
                elif app.carLoanDetail and app.carLoanDetail.loan_amount_required is not None:
                    try:
                        loan_amt = float(app.carLoanDetail.loan_amount_required)
                    except (ValueError, TypeError):
                        loan_amt = 0.0
                elif app.personalLoanDetail and (app.personalLoanDetail.loan_amount_required is not None or app.personalLoanDetail.required_amount is not None):
                    try:
                        loan_amt = float(app.personalLoanDetail.loan_amount_required or app.personalLoanDetail.required_amount)
                    except (ValueError, TypeError):
                        loan_amt = 0.0
                elif app.clientGeneralDetail and app.clientGeneralDetail.loan_amount_required is not None:
                    try:
                        loan_amt = float(app.clientGeneralDetail.loan_amount_required)
                    except (ValueError, TypeError):
                        loan_amt = 0.0

                total_volume += loan_amt

            results.append({
                "agentId": a.id,
                "name": a.name,
                "email": a.email,
                "mobile": a.mobile,
                "isAdmin": a.isAdmin,
                "isActive": a.isActive,
                "photo": a.photo,
                "totalAssignedLoans": total_count,
                "totalLoanVolumeRequested": total_volume,
                "statusBreakdown": status_counts,
            })

        return results

