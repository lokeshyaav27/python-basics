from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.contact_enquiry import ContactEnquiry


class ContactRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        name: str,
        email: str,
        mobile: str,
        loan_type: Optional[str] = None,
        message: Optional[str] = None,
    ) -> ContactEnquiry:
        enquiry = ContactEnquiry(
            name=name,
            email=email,
            mobile=mobile,
            loanType=loan_type,
            message=message,
            status="New",
            isActive=True,
        )
        self.db.add(enquiry)
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def list_enquiries(self, include_inactive: bool = False) -> List[ContactEnquiry]:
        query = self.db.query(ContactEnquiry)
        if not include_inactive:
            query = query.filter(ContactEnquiry.isActive != False)
        return query.order_by(ContactEnquiry.id.desc()).all()

    def get_by_id(self, enquiry_id: int) -> Optional[ContactEnquiry]:
        return self.db.query(ContactEnquiry).filter(ContactEnquiry.id == enquiry_id).first()

    def update_status(self, enquiry: ContactEnquiry, status: str) -> ContactEnquiry:
        enquiry.status = status
        self.db.add(enquiry)
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def update_enquiry(
        self,
        enquiry: ContactEnquiry,
        status: Optional[str] = None,
        admin_comment: Optional[str] = None,
    ) -> ContactEnquiry:
        if status is not None:
            enquiry.status = status
        if admin_comment is not None:
            enquiry.adminComment = admin_comment
        self.db.add(enquiry)
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def soft_delete(self, enquiry: ContactEnquiry) -> ContactEnquiry:
        enquiry.isActive = False
        self.db.add(enquiry)
        self.db.commit()
        return enquiry

    def list_enquiries_filtered(
        self,
        status: Optional[str] = None,
        loan_type: Optional[str] = None,
        limit: int = 20,
    ) -> List[ContactEnquiry]:
        query = self.db.query(ContactEnquiry).filter(ContactEnquiry.isActive != False)
        if status and status.lower() != "all":
            query = query.filter(ContactEnquiry.status.ilike(f"%{status}%"))
        if loan_type and loan_type.lower() != "all":
            query = query.filter(ContactEnquiry.loanType.ilike(f"%{loan_type}%"))
        return query.order_by(ContactEnquiry.id.desc()).limit(limit).all()

