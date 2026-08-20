from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.agent import Agent


AGENT_TOOLS_SPECS = [
    {
        "name": "get_agent_list",
        "description": "Lists active DSA agents with contact details (Admin only).",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]


def get_agent_list(
    db: Session,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"
    if role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Only administrators can view the complete agent roster.")

    agents = db.query(Agent).filter(Agent.isActive != False).order_by(Agent.id.asc()).all()
    return {
        "totalAgents": len(agents),
        "agents": [
            {
                "id": a.id,
                "name": a.name,
                "email": a.email,
                "mobile": a.mobile,
                "photo": a.photo,
                "isAdmin": a.isAdmin,
            }
            for a in agents
        ]
    }
