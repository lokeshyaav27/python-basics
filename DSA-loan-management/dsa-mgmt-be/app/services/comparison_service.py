from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.services.comparison.engine import compare_banks_for_application
from app.core.security import CurrentUser


class ComparisonService:
    def __init__(self, db: Session):
        self.db = db

    def compare_banks(
        self,
        application_id: int,
        bank_ids_str: str,
        current_user: CurrentUser,
    ) -> Dict[str, Any]:
        try:
            parsed_bank_ids = [int(bid.strip()) for bid in bank_ids_str.split(",") if bid.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bankIds format. Provide comma-separated integers.")

        if len(parsed_bank_ids) > 2:
            raise HTTPException(status_code=400, detail="You cannot compare more than 2 banks at once.")
        if len(parsed_bank_ids) == 0:
            raise HTTPException(status_code=400, detail="Please select at least 1 bank to compare.")

        effective_role = current_user.role

        return compare_banks_for_application(
            db=self.db,
            application_id=application_id,
            bank_ids=parsed_bank_ids,
            user_role=effective_role,
        )
