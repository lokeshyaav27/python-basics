from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from app.models.contact_enquiry import ContactEnquiry
from app.repositories.contact_repository import ContactRepository


class ContactService:
    def __init__(self, contact_repo: ContactRepository):
        self.contact_repo = contact_repo

    @staticmethod
    def serialize(e: ContactEnquiry) -> Dict[str, Any]:
        return {
            "id": e.id,
            "name": e.name,
            "email": e.email,
            "mobile": e.mobile,
            "loanType": e.loanType,
            "message": e.message,
            "status": e.status,
            "createdAt": e.createdAt.isoformat() if e.createdAt else None,
            "isActive": e.isActive,
        }

    def submit_enquiry(
        self,
        name: str,
        email: str,
        mobile: str,
        loan_type: Optional[str] = None,
        message: Optional[str] = None,
    ) -> Dict[str, Any]:
        n = name.strip() if name else ""
        e = email.strip() if email else ""
        m = mobile.strip() if mobile else ""

        if not n or not e or not m:
            raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

        enquiry = self.contact_repo.create(
            name=n,
            email=e,
            mobile=m,
            loan_type=loan_type,
            message=message,
        )
        return self.serialize(enquiry)

    def list_enquiries(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        enquiries = self.contact_repo.list_enquiries(include_inactive=include_inactive)
        return [self.serialize(e) for e in enquiries]

    def update_enquiry_status(self, enquiry_id: int, status: str) -> Dict[str, Any]:
        enquiry = self.contact_repo.get_by_id(enquiry_id)
        if not enquiry:
            raise HTTPException(status_code=404, detail="Enquiry not found")

        updated = self.contact_repo.update_status(enquiry, status)
        return self.serialize(updated)

    def delete_enquiry(self, enquiry_id: int) -> dict:
        enquiry = self.contact_repo.get_by_id(enquiry_id)
        if not enquiry:
            raise HTTPException(status_code=404, detail="Enquiry not found")

        self.contact_repo.soft_delete(enquiry)
        return {"id": enquiry_id, "deleted": True}
