from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.loan_application import LoanApplication
from app.models.client_general_detail import ClientGeneralDetail
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail


class LoanApplicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_applications(
        self,
        agent_id: Optional[int] = None,
        mobile: Optional[str] = None,
        include_inactive: bool = False,
    ) -> List[LoanApplication]:
        query = self.db.query(LoanApplication)
        if not include_inactive:
            query = query.filter(LoanApplication.isActive != False)
        if agent_id is not None:
            query = query.filter(LoanApplication.agentId == agent_id)
        if mobile is not None:
            query = query.filter(LoanApplication.mobile == mobile)
        return query.order_by(LoanApplication.id.desc()).all()

    def get_by_id(self, application_id: int) -> Optional[LoanApplication]:
        return self.db.query(LoanApplication).filter(LoanApplication.id == application_id).first()

    def get_by_customer_mobile(self, mobile: str) -> List[LoanApplication]:
        return (
            self.db.query(LoanApplication)
            .filter(LoanApplication.mobile == mobile, LoanApplication.isActive != False)
            .order_by(LoanApplication.id.desc())
            .all()
        )

    def create_client_general_detail(self, data: Dict[str, Any]) -> ClientGeneralDetail:
        record = ClientGeneralDetail(
            name=data.get("name"),
            age=data.get("age"),
            gender=data.get("gender"),
            location=data.get("location"),
            employment_type=data.get("employment_type"),
            monthly_income=data.get("monthly_income"),
            monthly_obligation=data.get("monthly_obligation"),
            existing_emi=data.get("existing_emi"),
            cibil_score=data.get("cibil_score"),
            loan_amount_required=data.get("loan_amount_required"),
            preferred_tenure=data.get("preferred_tenure"),
            isSalaried=data.get("isSalaried", True),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_client_general_detail(
        self, instance: ClientGeneralDetail, data: Dict[str, Any]
    ) -> ClientGeneralDetail:
        for field in [
            "name",
            "age",
            "gender",
            "location",
            "employment_type",
            "monthly_income",
            "monthly_obligation",
            "existing_emi",
            "cibil_score",
            "loan_amount_required",
            "preferred_tenure",
            "isSalaried",
        ]:
            if field in data:
                setattr(instance, field, data[field])
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def create_home_loan_detail(self, data: Dict[str, Any]) -> HomeLoanDetail:
        record = HomeLoanDetail(
            property_value=data.get("property_value"),
            property_location=data.get("property_location"),
            propertyUsageType=data.get("propertyUsageType"),
            down_payment=data.get("down_payment"),
            isPartProperty=data.get("isPartProperty", False),
            propertyRequirement=data.get("propertyRequirement"),
            propertyType=data.get("propertyType"),
            propertyStatus=data.get("propertyStatus"),
            femaleCoApplicant=data.get("femaleCoApplicant", False),
            propertyInsurance=data.get("propertyInsurance", True),
            applicantInsurance=data.get("applicantInsurance", True),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_home_loan_detail(
        self, instance: HomeLoanDetail, data: Dict[str, Any]
    ) -> HomeLoanDetail:
        for field in [
            "property_value",
            "property_location",
            "propertyUsageType",
            "down_payment",
            "isPartProperty",
            "propertyRequirement",
            "propertyType",
            "propertyStatus",
            "femaleCoApplicant",
            "propertyInsurance",
            "applicantInsurance",
        ]:
            if field in data:
                setattr(instance, field, data[field])
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def create_car_loan_detail(self, data: Dict[str, Any]) -> CarLoanDetail:
        record = CarLoanDetail(
            new_or_used=data.get("new_or_used"),
            car_value=data.get("car_value"),
            down_payment=data.get("down_payment"),
            vehicle_age=data.get("vehicle_age"),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_car_loan_detail(
        self, instance: CarLoanDetail, data: Dict[str, Any]
    ) -> CarLoanDetail:
        for field in ["new_or_used", "car_value", "down_payment", "vehicle_age"]:
            if field in data:
                setattr(instance, field, data[field])
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def create_personal_loan_detail(self, data: Dict[str, Any]) -> PersonalLoanDetail:
        record = PersonalLoanDetail(
            loan_purpose=data.get("loan_purpose"),
            other=data.get("other"),
            required_amount=data.get("required_amount"),
            existing_obligations=data.get("existing_obligations"),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_personal_loan_detail(
        self, instance: PersonalLoanDetail, data: Dict[str, Any]
    ) -> PersonalLoanDetail:
        for field in ["loan_purpose", "other", "required_amount", "existing_obligations"]:
            if field in data:
                setattr(instance, field, data[field])
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def create_application(
        self,
        name: str,
        email: str,
        mobile: str,
        unique_customer_id: str,
        product_id: Optional[int] = None,
        agent_id: Optional[int] = None,
        bank_id: Optional[int] = None,
        status: str = "Lead Created",
        description: Optional[str] = None,
        client_general_id: Optional[int] = None,
        home_loan_id: Optional[int] = None,
        car_loan_id: Optional[int] = None,
        personal_loan_id: Optional[int] = None,
    ) -> LoanApplication:
        app = LoanApplication(
            name=name,
            email=email,
            mobile=mobile,
            uniqueCustomerId=unique_customer_id,
            productId=product_id,
            agentId=agent_id,
            bankId=bank_id,
            status=status,
            description=description,
            clientGeneralDetailTableId=client_general_id,
            homeLoanDetailId=home_loan_id,
            carLoanDetailId=car_loan_id,
            personalLoanDetailId=personal_loan_id,
            isActive=True,
        )
        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)
        return app

    def save(self, app: LoanApplication) -> LoanApplication:
        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)
        return app

    def soft_delete(self, app: LoanApplication) -> LoanApplication:
        app.isActive = False
        self.db.add(app)
        self.db.commit()
        return app
