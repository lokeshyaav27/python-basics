from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.db.session import SessionLocal
from app.models.contact_enquiry import ContactEnquiry
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ContactEnquiryCreate(BaseModel):
    name: str
    email: str
    mobile: str
    loanType: Optional[str] = None
    message: Optional[str] = None


class ContactEnquiryStatusUpdate(BaseModel):
    status: str


def _serialize(e: ContactEnquiry) -> dict:
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


# Public: Anyone can submit a contact / loan inquiry
@router.post("")
def create_contact_enquiry(payload: ContactEnquiryCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    enquiry = ContactEnquiry(
        name=name,
        email=email,
        mobile=mobile,
        loanType=payload.loanType.strip() if payload.loanType else None,
        message=payload.message.strip() if payload.message else None,
        status="new",
        isActive=True,
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    return success_response(
        result=_serialize(enquiry),
        message="Enquiry submitted successfully",
        status_code=201,
    )


# Admin Only: List all customer enquiries
@router.get("")
def list_contact_enquiries(
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    enquiries = (
        db.query(ContactEnquiry)
        .filter(ContactEnquiry.isActive == True)
        .order_by(ContactEnquiry.id.desc())
        .all()
    )
    return success_response(
        result=[_serialize(e) for e in enquiries],
        message="Contact enquiries fetched successfully",
    )


# Admin Only: Update enquiry status
@router.put("/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    payload: ContactEnquiryStatusUpdate,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    enquiry = db.query(ContactEnquiry).filter(ContactEnquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    enquiry.status = payload.status.strip()
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    return success_response(
        result=_serialize(enquiry),
        message=f"Enquiry status updated to {enquiry.status}",
    )
