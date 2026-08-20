from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.repositories.contact_repository import ContactRepository
from app.services.contact_service import ContactService
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_contact_service(db: Session = Depends(get_db)) -> ContactService:
    repo = ContactRepository(db)
    return ContactService(repo)


class ContactEnquiryCreate(BaseModel):
    name: str
    email: str
    mobile: str
    loanType: Optional[str] = None
    message: Optional[str] = None


class ContactEnquiryStatusUpdate(BaseModel):
    status: Optional[str] = None
    adminComment: Optional[str] = None
    admin_comment: Optional[str] = None


# Public: Anyone can submit a contact / loan inquiry
@router.post("")
def create_contact_enquiry(
    payload: ContactEnquiryCreate,
    contact_service: ContactService = Depends(get_contact_service),
):
    enquiry = contact_service.submit_enquiry(
        name=payload.name,
        email=payload.email,
        mobile=payload.mobile,
        loan_type=payload.loanType,
        message=payload.message,
    )
    return success_response(
        result=enquiry,
        message="Thank you for contacting us! Our team will reach out shortly.",
        status_code=201,
    )


# Admin Only: List all enquiries
@router.get("")
def list_contact_enquiries(
    include_inactive: bool = False,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    contact_service: ContactService = Depends(get_contact_service),
):
    enquiries = contact_service.list_enquiries(include_inactive=include_inactive)
    return success_response(
        result=enquiries,
        message="Contact enquiries fetched successfully",
    )


# Admin Only: Update status / admin comment of an enquiry
@router.put("/{enquiry_id}/status")
@router.put("/{enquiry_id}")
def update_contact_enquiry_status(
    enquiry_id: int,
    payload: ContactEnquiryStatusUpdate,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    contact_service: ContactService = Depends(get_contact_service),
):
    admin_comment = payload.adminComment if payload.adminComment is not None else payload.admin_comment
    enquiry = contact_service.update_enquiry(
        enquiry_id=enquiry_id,
        status=payload.status,
        admin_comment=admin_comment,
    )
    msg = f"Enquiry status updated to {payload.status}" if payload.status else "Enquiry updated successfully"
    return success_response(
        result=enquiry,
        message=msg,
    )


# Admin Only: Soft delete an enquiry
@router.delete("/{enquiry_id}")
def delete_contact_enquiry(
    enquiry_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    contact_service: ContactService = Depends(get_contact_service),
):
    res = contact_service.delete_enquiry(enquiry_id)
    return success_response(
        result=res,
        message="Enquiry removed successfully",
    )
