from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.loan_application import LoanApplication
from app.models.agent import Agent
from app.models.bank import Bank
from app.models.product import Product
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail
from app.models.client_general_detail import ClientGeneralDetail

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class LoanApplicationCreate(BaseModel):
    name: str
    email: str
    mobile: str
    productId: Optional[int] = None


class LoanApplicationUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    productId: Optional[int] = None
    clientGeneralDetails: Optional[dict] = None
    homeLoanDetails: Optional[dict] = None
    carLoanDetails: Optional[dict] = None
    personalLoanDetails: Optional[dict] = None


class FullLoanApplicationPayload(BaseModel):
    productId: int
    name: str
    email: str
    mobile: str
    clientGeneralDetails: Optional[dict] = None
    homeLoanDetails: Optional[dict] = None
    carLoanDetails: Optional[dict] = None
    personalLoanDetails: Optional[dict] = None


class AssignAgentPayload(BaseModel):
    agentId: Optional[int] = None


class ApplicationStatusPayload(BaseModel):
    status: Optional[str] = None
    bankId: Optional[int] = None
    description: Optional[str] = None


def _serialize(app: LoanApplication) -> dict:
    return {
        "id": app.id,
        "name": app.name,
        "email": app.email,
        "mobile": app.mobile,
        "uniqueCustomerId": app.uniqueCustomerId,
        "agentId": app.agentId,
        "agentName": app.agent.name if app.agent else None,
        "agentPhoto": app.agent.photo if app.agent else None,
        "agentMobile": app.agent.mobile if app.agent else None,
        "agentEmail": app.agent.email if app.agent else None,
        "bankId": app.bankId,
        "bankName": app.bank.name if app.bank else None,
        "bankLogo": app.bank.logo if app.bank else None,
        "productId": app.productId,
        "productName": app.product.name if app.product else None,
        "productImage": app.product.image if app.product else None,
        "clientGeneralDetailTableId": app.clientGeneralDetailTableId,
        "homeLoanDetailId": app.homeLoanDetailId,
        "carLoanDetailId": app.carLoanDetailId,
        "personalLoanDetailId": app.personalLoanDetailId,
        "clientGeneralDetails": {
            "name": app.clientGeneralDetail.name,
            "age": app.clientGeneralDetail.age,
            "gender": app.clientGeneralDetail.gender,
            "location": app.clientGeneralDetail.location,
            "employment_type": app.clientGeneralDetail.employment_type,
            "monthly_income": float(app.clientGeneralDetail.monthly_income) if app.clientGeneralDetail.monthly_income is not None else None,
            "monthly_obligation": float(app.clientGeneralDetail.monthly_obligation) if app.clientGeneralDetail.monthly_obligation is not None else None,
            "existing_emi": float(app.clientGeneralDetail.existing_emi) if app.clientGeneralDetail.existing_emi is not None else None,
            "cibil_score": app.clientGeneralDetail.cibil_score,
            "loan_amount_required": float(app.clientGeneralDetail.loan_amount_required) if app.clientGeneralDetail.loan_amount_required is not None else None,
            "preferred_tenure": app.clientGeneralDetail.preferred_tenure,
            "isSalaried": app.clientGeneralDetail.isSalaried,
        } if app.clientGeneralDetail else None,
        "homeLoanDetails": {
            "property_value": float(app.homeLoanDetail.property_value) if app.homeLoanDetail.property_value is not None else None,
            "property_location": app.homeLoanDetail.property_location,
            "propertyUsageType": app.homeLoanDetail.propertyUsageType,
            "down_payment": float(app.homeLoanDetail.down_payment) if app.homeLoanDetail.down_payment is not None else None,
            "isPartProperty": app.homeLoanDetail.isPartProperty,
            "propertyRequirement": app.homeLoanDetail.propertyRequirement,
            "propertyType": app.homeLoanDetail.propertyType,
            "propertyStatus": app.homeLoanDetail.propertyStatus,
            "femaleCoApplicant": app.homeLoanDetail.femaleCoApplicant,
            "propertyInsurance": app.homeLoanDetail.propertyInsurance,
            "applicantInsurance": app.homeLoanDetail.applicantInsurance,
        } if app.homeLoanDetail else None,
        "carLoanDetails": {
            "new_or_used": app.carLoanDetail.new_or_used,
            "car_value": float(app.carLoanDetail.car_value) if app.carLoanDetail.car_value is not None else None,
            "down_payment": float(app.carLoanDetail.down_payment) if app.carLoanDetail.down_payment is not None else None,
            "vehicle_age": app.carLoanDetail.vehicle_age,
        } if app.carLoanDetail else None,
        "personalLoanDetails": {
            "loan_purpose": app.personalLoanDetail.loan_purpose,
            "other": app.personalLoanDetail.other,
            "required_amount": float(app.personalLoanDetail.required_amount) if app.personalLoanDetail.required_amount is not None else None,
            "existing_obligations": float(app.personalLoanDetail.existing_obligations) if app.personalLoanDetail.existing_obligations is not None else None,
        } if app.personalLoanDetail else None,
        "status": app.status,
        "description": app.description,
        "isActive": app.isActive,
    }


@router.get("")
@router.get("/")
def list_loan_applications(
    agent_id: Optional[int] = None,
    mobile: Optional[str] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(LoanApplication)
    if not include_inactive:
        query = query.filter(LoanApplication.isActive != False)
    if agent_id is not None:
        query = query.filter(LoanApplication.agentId == agent_id)
    if mobile is not None and mobile.strip():
        m = mobile.strip()
        query = query.filter(
            (LoanApplication.mobile.ilike(f"%{m}%"))
            | (LoanApplication.uniqueCustomerId.ilike(f"%{m}%"))
            | (LoanApplication.email.ilike(f"%{m}%"))
            | (LoanApplication.name.ilike(f"%{m}%"))
        )
    applications = query.all()
    return [_serialize(a) for a in applications]


@router.get("/{application_id}")
def get_loan_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")
    return _serialize(app)


@router.post("/apply")
def submit_full_loan_application(payload: FullLoanApplicationPayload, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    # 1. Create client general details if provided
    client_gen_id = None
    if payload.clientGeneralDetails:
        cgd_data = payload.clientGeneralDetails
        cgd = ClientGeneralDetail(
            name=name,
            age=int(cgd_data.get("age")) if cgd_data.get("age") is not None and str(cgd_data.get("age")).isdigit() else None,
            gender=str(cgd_data.get("gender") or "") or None,
            location=str(cgd_data.get("location") or "") or None,
            employment_type=str(cgd_data.get("employment_type") or "") or None,
            monthly_income=cgd_data.get("monthly_income") or None,
            monthly_obligation=cgd_data.get("monthly_obligation") or None,
            existing_emi=cgd_data.get("existing_emi") or None,
            cibil_score=int(cgd_data.get("cibil_score")) if cgd_data.get("cibil_score") is not None and str(cgd_data.get("cibil_score")).isdigit() else None,
            loan_amount_required=cgd_data.get("loan_amount_required") or None,
            preferred_tenure=int(cgd_data.get("preferred_tenure")) if cgd_data.get("preferred_tenure") is not None and str(cgd_data.get("preferred_tenure")).isdigit() else None,
            isSalaried=bool(cgd_data.get("isSalaried", True)),
        )
        db.add(cgd)
        db.flush()
        client_gen_id = cgd.id

    # 2. Create product specific details
    home_loan_id = None
    if payload.homeLoanDetails:
        hld_data = payload.homeLoanDetails
        hld = HomeLoanDetail(
            property_value=hld_data.get("property_value") or None,
            property_location=str(hld_data.get("property_location") or "") or None,
            propertyUsageType=str(hld_data.get("propertyUsageType") or "") or None,
            down_payment=hld_data.get("down_payment") or None,
            isPartProperty=bool(hld_data.get("isPartProperty", False)),
            propertyRequirement=str(hld_data.get("propertyRequirement") or "") or None,
            propertyType=str(hld_data.get("propertyType") or "") or None,
            propertyStatus=str(hld_data.get("propertyStatus") or "") or None,
            femaleCoApplicant=bool(hld_data.get("femaleCoApplicant", False)),
            propertyInsurance=bool(hld_data.get("propertyInsurance", False)),
            applicantInsurance=bool(hld_data.get("applicantInsurance", False)),
        )
        db.add(hld)
        db.flush()
        home_loan_id = hld.id

    car_loan_id = None
    if payload.carLoanDetails:
        cld_data = payload.carLoanDetails
        cld = CarLoanDetail(
            new_or_used=str(cld_data.get("new_or_used") or "") or None,
            car_value=cld_data.get("car_value") or None,
            down_payment=cld_data.get("down_payment") or None,
            vehicle_age=int(cld_data.get("vehicle_age")) if cld_data.get("vehicle_age") is not None and str(cld_data.get("vehicle_age")).isdigit() else None,
        )
        db.add(cld)
        db.flush()
        car_loan_id = cld.id

    personal_loan_id = None
    if payload.personalLoanDetails:
        pld_data = payload.personalLoanDetails
        pld = PersonalLoanDetail(
            loan_purpose=str(pld_data.get("loan_purpose") or "") or None,
            other=str(pld_data.get("other") or "") or None,
            required_amount=pld_data.get("required_amount") or None,
            existing_obligations=pld_data.get("existing_obligations") or None,
        )
        db.add(pld)
        db.flush()
        personal_loan_id = pld.id

    # 3. Create LoanApplication record
    app = LoanApplication(
        name=name,
        email=email,
        mobile=mobile,
        uniqueCustomerId=mobile,
        productId=payload.productId,
        clientGeneralDetailTableId=client_gen_id,
        homeLoanDetailId=home_loan_id,
        carLoanDetailId=car_loan_id,
        personalLoanDetailId=personal_loan_id,
        status=None,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return {"status": "ok", "application": _serialize(app)}


@router.post("")
@router.post("/")
def create_loan_application(payload: LoanApplicationCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip()
    mobile = payload.mobile.strip()

    if not name or not email or not mobile:
        raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

    app = LoanApplication(
        name=name,
        email=email,
        mobile=mobile,
        uniqueCustomerId=mobile,
        productId=payload.productId,
        status=None,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{application_id}")
def update_loan_application(
    application_id: int,
    payload: LoanApplicationUpdate,
    db: Session = Depends(get_db)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    # Lock editing if application is already approved or rejected
    if app.status in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail=f"This loan application has already been {app.status} and cannot be modified."
        )

    if payload.name is not None and payload.name.strip():
        app.name = payload.name.strip()
    if payload.email is not None and payload.email.strip():
        app.email = payload.email.strip()
    if payload.mobile is not None and payload.mobile.strip():
        app.mobile = payload.mobile.strip()
    if payload.productId is not None:
        app.productId = payload.productId

    # 1. Update / Create Client General Details
    if payload.clientGeneralDetails is not None:
        cgd_data = payload.clientGeneralDetails
        cgd = app.clientGeneralDetail
        if not cgd:
            cgd = ClientGeneralDetail()
            db.add(cgd)
            db.flush()
            app.clientGeneralDetailTableId = cgd.id

        if "name" in cgd_data:
            cgd.name = cgd_data.get("name") or app.name
        if "age" in cgd_data:
            cgd.age = int(cgd_data.get("age")) if cgd_data.get("age") is not None and str(cgd_data.get("age")).isdigit() else None
        if "gender" in cgd_data:
            cgd.gender = str(cgd_data.get("gender") or "") or None
        if "location" in cgd_data:
            cgd.location = str(cgd_data.get("location") or "") or None
        if "employment_type" in cgd_data:
            cgd.employment_type = str(cgd_data.get("employment_type") or "") or None
        if "monthly_income" in cgd_data:
            cgd.monthly_income = float(cgd_data.get("monthly_income")) if cgd_data.get("monthly_income") is not None and str(cgd_data.get("monthly_income")).replace(".", "", 1).isdigit() else None
        if "monthly_obligation" in cgd_data:
            cgd.monthly_obligation = float(cgd_data.get("monthly_obligation")) if cgd_data.get("monthly_obligation") is not None and str(cgd_data.get("monthly_obligation")).replace(".", "", 1).isdigit() else None
        if "existing_emi" in cgd_data:
            cgd.existing_emi = float(cgd_data.get("existing_emi")) if cgd_data.get("existing_emi") is not None and str(cgd_data.get("existing_emi")).replace(".", "", 1).isdigit() else None
        if "cibil_score" in cgd_data:
            cgd.cibil_score = int(cgd_data.get("cibil_score")) if cgd_data.get("cibil_score") is not None and str(cgd_data.get("cibil_score")).isdigit() else None
        if "loan_amount_required" in cgd_data:
            cgd.loan_amount_required = float(cgd_data.get("loan_amount_required")) if cgd_data.get("loan_amount_required") is not None and str(cgd_data.get("loan_amount_required")).replace(".", "", 1).isdigit() else None
        if "preferred_tenure" in cgd_data:
            cgd.preferred_tenure = int(cgd_data.get("preferred_tenure")) if cgd_data.get("preferred_tenure") is not None and str(cgd_data.get("preferred_tenure")).isdigit() else None
        if "isSalaried" in cgd_data:
            cgd.isSalaried = bool(cgd_data.get("isSalaried"))

    # 2. Update / Create Home Loan Details
    if payload.homeLoanDetails is not None:
        h_data = payload.homeLoanDetails
        hld = app.homeLoanDetail
        if not hld:
            hld = HomeLoanDetail()
            db.add(hld)
            db.flush()
            app.homeLoanDetailId = hld.id

        if "property_value" in h_data:
            hld.property_value = float(h_data.get("property_value")) if h_data.get("property_value") is not None and str(h_data.get("property_value")).replace(".", "", 1).isdigit() else None
        if "property_location" in h_data:
            hld.property_location = str(h_data.get("property_location") or "") or None
        if "propertyUsageType" in h_data:
            hld.propertyUsageType = str(h_data.get("propertyUsageType") or "") or None
        if "down_payment" in h_data:
            hld.down_payment = float(h_data.get("down_payment")) if h_data.get("down_payment") is not None and str(h_data.get("down_payment")).replace(".", "", 1).isdigit() else None
        if "isPartProperty" in h_data:
            hld.isPartProperty = bool(h_data.get("isPartProperty"))
        if "propertyRequirement" in h_data:
            hld.propertyRequirement = str(h_data.get("propertyRequirement") or "") or None
        if "propertyType" in h_data:
            hld.propertyType = str(h_data.get("propertyType") or "") or None
        if "propertyStatus" in h_data:
            hld.propertyStatus = str(h_data.get("propertyStatus") or "") or None
        if "femaleCoApplicant" in h_data:
            hld.femaleCoApplicant = bool(h_data.get("femaleCoApplicant"))
        if "propertyInsurance" in h_data:
            hld.propertyInsurance = bool(h_data.get("propertyInsurance"))
        if "applicantInsurance" in h_data:
            hld.applicantInsurance = bool(h_data.get("applicantInsurance"))

    # 3. Update / Create Car Loan Details
    if payload.carLoanDetails is not None:
        c_data = payload.carLoanDetails
        cld = app.carLoanDetail
        if not cld:
            cld = CarLoanDetail()
            db.add(cld)
            db.flush()
            app.carLoanDetailId = cld.id

        if "new_or_used" in c_data:
            cld.new_or_used = str(c_data.get("new_or_used") or "") or None
        if "car_value" in c_data:
            cld.car_value = float(c_data.get("car_value")) if c_data.get("car_value") is not None and str(c_data.get("car_value")).replace(".", "", 1).isdigit() else None
        if "down_payment" in c_data:
            cld.down_payment = float(c_data.get("down_payment")) if c_data.get("down_payment") is not None and str(c_data.get("down_payment")).replace(".", "", 1).isdigit() else None
        if "vehicle_age" in c_data:
            cld.vehicle_age = int(c_data.get("vehicle_age")) if c_data.get("vehicle_age") is not None and str(c_data.get("vehicle_age")).isdigit() else 0

    # 4. Update / Create Personal Loan Details
    if payload.personalLoanDetails is not None:
        p_data = payload.personalLoanDetails
        pld = app.personalLoanDetail
        if not pld:
            pld = PersonalLoanDetail()
            db.add(pld)
            db.flush()
            app.personalLoanDetailId = pld.id

        if "loan_purpose" in p_data:
            pld.loan_purpose = str(p_data.get("loan_purpose") or "") or None
        if "other" in p_data:
            pld.other = str(p_data.get("other") or "") or None
        if "required_amount" in p_data:
            pld.required_amount = float(p_data.get("required_amount")) if p_data.get("required_amount") is not None and str(p_data.get("required_amount")).replace(".", "", 1).isdigit() else None
        if "existing_obligations" in p_data:
            pld.existing_obligations = float(p_data.get("existing_obligations")) if p_data.get("existing_obligations") is not None and str(p_data.get("existing_obligations")).replace(".", "", 1).isdigit() else None

    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{application_id}/assign-agent")
def assign_agent(
    application_id: int,
    payload: AssignAgentPayload,
    db: Session = Depends(get_db)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    if payload.agentId is not None:
        agent = db.query(Agent).filter(Agent.id == payload.agentId).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        if agent.isActive is False:
            raise HTTPException(status_code=400, detail="Cannot assign a deactivated agent")

    app.agentId = payload.agentId
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


def _is_application_complete(app: LoanApplication) -> tuple[bool, str]:
    if not app.clientGeneralDetail:
        return False, "Customer personal and financial details have not been filled."
    
    cgd = app.clientGeneralDetail
    if not cgd.name or cgd.age is None or not cgd.gender or not cgd.location or cgd.monthly_income is None or cgd.loan_amount_required is None or cgd.preferred_tenure is None:
        return False, "Customer personal/financial profile is incomplete. Please complete all fields."

    pname = (app.product.name or "").lower() if app.product else ""
    if "home" in pname:
        if not app.homeLoanDetail or app.homeLoanDetail.property_value is None or not app.homeLoanDetail.property_location:
            return False, "Home loan property details have not been completed."
    elif "car" in pname:
        if not app.carLoanDetail or app.carLoanDetail.car_value is None or not app.carLoanDetail.new_or_used:
            return False, "Car loan vehicle details have not been completed."
    elif "personal" in pname:
        if not app.personalLoanDetail or app.personalLoanDetail.required_amount is None or not app.personalLoanDetail.loan_purpose:
            return False, "Personal loan purpose and amount details have not been completed."

    return True, ""


@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    payload: ApplicationStatusPayload,
    db: Session = Depends(get_db)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    # Enforce non-reversible one-time decision rule
    if app.status in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail=f"This loan application has already been {app.status}. Decisions are permanent and cannot be modified or reversed."
        )

    raw_status = (payload.status or "").strip().lower() if payload.status else None

    if raw_status == "approved":
        is_complete, reason = _is_application_complete(app)
        if not is_complete:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve and forward application: {reason}"
            )

        if payload.bankId is not None:
            bank = db.query(Bank).filter(Bank.id == payload.bankId).first()
            if not bank:
                raise HTTPException(status_code=404, detail="Selected bank not found")
            app.bankId = payload.bankId
        if payload.description is not None:
            app.description = payload.description.strip() or None
        app.status = "approved"

    elif raw_status == "rejected":
        if not payload.description or not payload.description.strip():
            raise HTTPException(status_code=400, detail="Rejection reason is required")
        app.description = payload.description.strip()
        app.bankId = None
        app.status = "rejected"

    else:
        raise HTTPException(status_code=400, detail="Invalid decision. Application can only be approved or rejected.")

    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.delete("/{application_id}")
def delete_loan_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    app.isActive = False
    db.add(app)
    db.commit()
    return {"status": "success", "message": "Loan application deactivated successfully"}
