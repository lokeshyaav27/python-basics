from typing import List, Optional, Dict, Any, Tuple
from fastapi import HTTPException
from sqlalchemy import or_
from dsa_common.models import LoanApplication
from dsa_common.models import Agent
from dsa_common.models import Bank
from dsa_common.models import ClientGeneralDetail
from dsa_common.models import HomeLoanDetail
from dsa_common.models import CarLoanDetail
from dsa_common.models import PersonalLoanDetail
from dsa_common.repositories import LoanApplicationRepository
from dsa_common.repositories import AgentRepository
from dsa_common.repositories import BankRepository
from app.core.security import CurrentUser


class LoanApplicationService:
    def __init__(
        self,
        loan_app_repo: LoanApplicationRepository,
        agent_repo: AgentRepository,
        bank_repo: BankRepository,
    ):
        self.loan_app_repo = loan_app_repo
        self.agent_repo = agent_repo
        self.bank_repo = bank_repo

    @staticmethod
    def serialize(app: LoanApplication) -> Dict[str, Any]:
        created_at_val = getattr(app, 'createdAt', None)
        # Calculate Commission Metrics

        cgd = app.clientGeneralDetail
        loan_amt = 0.0
        pref_tenure = None

        if app.homeLoanDetail:
            if app.homeLoanDetail.loan_amount_required is not None:
                try:
                    loan_amt = float(app.homeLoanDetail.loan_amount_required)
                except (ValueError, TypeError):
                    loan_amt = 0.0
            if app.homeLoanDetail.preferred_tenure is not None:
                pref_tenure = app.homeLoanDetail.preferred_tenure
        elif app.carLoanDetail:
            if app.carLoanDetail.loan_amount_required is not None:
                try:
                    loan_amt = float(app.carLoanDetail.loan_amount_required)
                except (ValueError, TypeError):
                    loan_amt = 0.0
            if app.carLoanDetail.preferred_tenure is not None:
                pref_tenure = app.carLoanDetail.preferred_tenure
        elif app.personalLoanDetail:
            req_val = app.personalLoanDetail.loan_amount_required if app.personalLoanDetail.loan_amount_required is not None else app.personalLoanDetail.required_amount
            if req_val is not None:
                try:
                    loan_amt = float(req_val)
                except (ValueError, TypeError):
                    loan_amt = 0.0
            if app.personalLoanDetail.preferred_tenure is not None:
                pref_tenure = app.personalLoanDetail.preferred_tenure

        if loan_amt == 0.0 and cgd and cgd.loan_amount_required is not None:
            try:
                loan_amt = float(cgd.loan_amount_required)
            except (ValueError, TypeError):
                loan_amt = 0.0
        if pref_tenure is None and cgd and cgd.preferred_tenure is not None:
            pref_tenure = cgd.preferred_tenure

        comm_pct = None
        comm_received = None
        comm_estimated = None

        if app.bankId and app.productId:
            target_link = None
            if app.bank:
                links = getattr(app.bank, 'product_links', [])
                target_link = next((l for l in links if getattr(l, 'productId', None) == app.productId and getattr(l, 'isActive', True) != False), None)
            
            if target_link and getattr(target_link, 'commission', None) is not None:
                try:
                    comm_pct = float(target_link.commission)
                except (ValueError, TypeError):
                    comm_pct = 1.0
            else:
                comm_pct = 1.0

            if comm_pct is not None and loan_amt > 0:
                comm_estimated = round((loan_amt * comm_pct) / 100.0, 2)
                is_approved = bool(app.status and any(w in app.status.lower() for w in ["approved", "disbursed", "sanction"]))
                if is_approved:
                    comm_received = comm_estimated


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
            "loanAmountRequired": loan_amt,
            "preferredTenure": pref_tenure,
            "commissionRatePct": comm_pct,
            "commissionReceived": comm_received,
            "commissionEstimated": comm_estimated,
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
                "loan_amount_required": float(app.homeLoanDetail.loan_amount_required) if app.homeLoanDetail.loan_amount_required is not None else None,
                "preferred_tenure": app.homeLoanDetail.preferred_tenure,
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
                "loan_amount_required": float(app.carLoanDetail.loan_amount_required) if app.carLoanDetail.loan_amount_required is not None else None,
                "preferred_tenure": app.carLoanDetail.preferred_tenure,
                "new_or_used": app.carLoanDetail.new_or_used,
                "car_value": float(app.carLoanDetail.car_value) if app.carLoanDetail.car_value is not None else None,
                "down_payment": float(app.carLoanDetail.down_payment) if app.carLoanDetail.down_payment is not None else None,
                "vehicle_age": app.carLoanDetail.vehicle_age,
            } if app.carLoanDetail else None,
            "personalLoanDetails": {
                "loan_amount_required": float(app.personalLoanDetail.loan_amount_required) if app.personalLoanDetail.loan_amount_required is not None else (float(app.personalLoanDetail.required_amount) if app.personalLoanDetail.required_amount is not None else None),
                "preferred_tenure": app.personalLoanDetail.preferred_tenure,
                "loan_purpose": app.personalLoanDetail.loan_purpose,
                "other": app.personalLoanDetail.other,
                "required_amount": float(app.personalLoanDetail.required_amount) if app.personalLoanDetail.required_amount is not None else (float(app.personalLoanDetail.loan_amount_required) if app.personalLoanDetail.loan_amount_required is not None else None),
                "existing_obligations": float(app.personalLoanDetail.existing_obligations) if app.personalLoanDetail.existing_obligations is not None else None,
            } if app.personalLoanDetail else None,
            "status": app.status,
            "description": app.description,
            "createdAt": created_at_val.isoformat() if created_at_val else None,
            "isActive": app.isActive,
        }


    def list_applications(
        self,
        agent_id: Optional[int],
        mobile: Optional[str],
        include_inactive: bool,
        current_user: CurrentUser,
    ) -> List[Dict[str, Any]]:
        query = self.loan_app_repo.db.query(LoanApplication)
        if not include_inactive:
            query = query.filter(LoanApplication.isActive != False)

        # Role Scope Filtering
        if current_user.role == "customer":
            ident_filters = []
            if current_user.uniqueCustomerId:
                ident_filters.append(LoanApplication.uniqueCustomerId == current_user.uniqueCustomerId)
            if current_user.mobile:
                ident_filters.append(LoanApplication.mobile == current_user.mobile)
            if current_user.id:
                ident_filters.append(LoanApplication.id == current_user.id)
            if ident_filters:
                query = query.filter(or_(*ident_filters))
            else:
                return []
        elif current_user.role == "agent":
            query = query.filter(LoanApplication.agentId == current_user.id)
        elif current_user.role == "admin":
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

        applications = query.order_by(LoanApplication.id.desc()).all()
        return [self.serialize(a) for a in applications]

    def get_application(self, application_id: int, current_user: CurrentUser) -> Dict[str, Any]:
        app = self.loan_app_repo.get_by_id(application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Loan application not found")

        # Ownership / Scope check
        if current_user.role == "customer":
            is_owner = (
                app.id == current_user.id
                or (current_user.uniqueCustomerId and app.uniqueCustomerId == current_user.uniqueCustomerId)
                or (current_user.mobile and app.mobile == current_user.mobile)
            )
            if not is_owner:
                raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this application.")
        elif current_user.role == "agent":
            if app.agentId is not None and app.agentId != current_user.id:
                raise HTTPException(status_code=403, detail="Forbidden: This application is assigned to another agent.")

        return self.serialize(app)

    def submit_full_loan_application(self, payload: Any) -> Dict[str, Any]:
        name = payload.name.strip()
        email = payload.email.strip()
        mobile = payload.mobile.strip()

        if not name or not email or not mobile:
            raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

        # 1. Create client general details if provided
        client_gen_id = None
        if payload.clientGeneralDetails:
            cgd_data = payload.clientGeneralDetails
            cgd = self.loan_app_repo.create_client_general_detail(cgd_data)
            client_gen_id = cgd.id

        # 2. Create product specific details
        home_loan_id = None
        if payload.homeLoanDetails:
            hld = self.loan_app_repo.create_home_loan_detail(payload.homeLoanDetails)
            home_loan_id = hld.id

        car_loan_id = None
        if payload.carLoanDetails:
            cld = self.loan_app_repo.create_car_loan_detail(payload.carLoanDetails)
            car_loan_id = cld.id

        personal_loan_id = None
        if payload.personalLoanDetails:
            pld = self.loan_app_repo.create_personal_loan_detail(payload.personalLoanDetails)
            personal_loan_id = pld.id

        # 3. Create LoanApplication record
        app = self.loan_app_repo.create_application(
            name=name,
            email=email,
            mobile=mobile,
            unique_customer_id=mobile,
            product_id=payload.productId,
            client_general_detail_id=client_gen_id,
            home_loan_detail_id=home_loan_id,
            car_loan_detail_id=car_loan_id,
            personal_loan_detail_id=personal_loan_id,
            status=None,
        )
        return self.serialize(app)

    def create_loan_application(self, payload: Any) -> Dict[str, Any]:
        name = payload.name.strip()
        email = payload.email.strip()
        mobile = payload.mobile.strip()

        if not name or not email or not mobile:
            raise HTTPException(status_code=400, detail="Name, email, and mobile are required")

        app = self.loan_app_repo.create_application(
            name=name,
            email=email,
            mobile=mobile,
            unique_customer_id=mobile,
            product_id=payload.productId,
            status=None,
        )
        return self.serialize(app)

    def update_loan_application(
        self, application_id: int, payload: Any, current_user: CurrentUser
    ) -> Dict[str, Any]:
        app = self.loan_app_repo.get_by_id(application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Loan application not found")

        # Ownership / Scope check
        if current_user.role == "customer":
            is_owner = (
                app.id == current_user.id
                or (current_user.uniqueCustomerId and app.uniqueCustomerId == current_user.uniqueCustomerId)
                or (current_user.mobile and app.mobile == current_user.mobile)
            )
            if not is_owner:
                raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to modify this application.")
        elif current_user.role == "agent":
            if app.agentId is not None and app.agentId != current_user.id:
                raise HTTPException(status_code=403, detail="Forbidden: This application is assigned to another agent.")

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
            if app.clientGeneralDetail:
                self.loan_app_repo.update_client_general_detail(app.clientGeneralDetail, payload.clientGeneralDetails)
            else:
                cgd = self.loan_app_repo.create_client_general_detail(payload.clientGeneralDetails)
                app.clientGeneralDetailTableId = cgd.id

        # 2. Update / Create Home Loan Details
        if payload.homeLoanDetails is not None:
            if app.homeLoanDetail:
                self.loan_app_repo.update_home_loan_detail(app.homeLoanDetail, payload.homeLoanDetails)
            else:
                hld = self.loan_app_repo.create_home_loan_detail(payload.homeLoanDetails)
                app.homeLoanDetailId = hld.id

        # 3. Update / Create Car Loan Details
        if payload.carLoanDetails is not None:
            if app.carLoanDetail:
                self.loan_app_repo.update_car_loan_detail(app.carLoanDetail, payload.carLoanDetails)
            else:
                cld = self.loan_app_repo.create_car_loan_detail(payload.carLoanDetails)
                app.carLoanDetailId = cld.id

        # 4. Update / Create Personal Loan Details
        if payload.personalLoanDetails is not None:
            if app.personalLoanDetail:
                self.loan_app_repo.update_personal_loan_detail(app.personalLoanDetail, payload.personalLoanDetails)
            else:
                pld = self.loan_app_repo.create_personal_loan_detail(payload.personalLoanDetails)
                app.personalLoanDetailId = pld.id

        saved = self.loan_app_repo.save(app)
        return self.serialize(saved)

    def assign_agent(self, application_id: int, agent_id: Optional[int]) -> Dict[str, Any]:
        app = self.loan_app_repo.get_by_id(application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Loan application not found")

        if agent_id is not None:
            agent = self.agent_repo.get_by_id(agent_id)
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
            if agent.isActive is False:
                raise HTTPException(status_code=400, detail="Cannot assign a deactivated agent")

        app.agentId = agent_id
        saved = self.loan_app_repo.save(app)
        return self.serialize(saved)

    def is_application_complete(self, app: LoanApplication) -> Tuple[bool, str]:
        if not app.clientGeneralDetail:
            return False, "Customer personal and financial details have not been filled."

        cgd = app.clientGeneralDetail
        if not cgd.name or cgd.age is None or not cgd.gender or not cgd.location or cgd.monthly_income is None:
            return False, "Customer personal/financial profile is incomplete. Please complete all fields."

        pname = (app.product.name or "").lower() if app.product else ""
        if "home" in pname:
            if not app.homeLoanDetail or app.homeLoanDetail.property_value is None or not app.homeLoanDetail.property_location:
                return False, "Home loan property details have not been completed."
            if app.homeLoanDetail.loan_amount_required is None and cgd.loan_amount_required is None:
                return False, "Home loan required amount has not been specified."
            if app.homeLoanDetail.preferred_tenure is None and cgd.preferred_tenure is None:
                return False, "Home loan preferred tenure has not been specified."
        elif "car" in pname:
            if not app.carLoanDetail or app.carLoanDetail.car_value is None or not app.carLoanDetail.new_or_used:
                return False, "Car loan vehicle details have not been completed."
            if app.carLoanDetail.loan_amount_required is None and cgd.loan_amount_required is None:
                return False, "Car loan required amount has not been specified."
            if app.carLoanDetail.preferred_tenure is None and cgd.preferred_tenure is None:
                return False, "Car loan preferred tenure has not been specified."
        elif "personal" in pname:
            pld = app.personalLoanDetail
            if not pld or (pld.required_amount is None and pld.loan_amount_required is None and cgd.loan_amount_required is None) or not pld.loan_purpose:
                return False, "Personal loan purpose and amount details have not been completed."
            if pld.preferred_tenure is None and cgd.preferred_tenure is None:
                return False, "Personal loan preferred tenure has not been specified."

        return True, ""

    def update_application_status(
        self,
        application_id: int,
        status: Optional[str],
        bank_id: Optional[int],
        description: Optional[str],
        current_user: CurrentUser,
    ) -> Dict[str, Any]:
        app = self.loan_app_repo.get_by_id(application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Loan application not found")

        if current_user.role == "agent":
            if app.agentId != current_user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You can only update status for applications assigned to you.")

        # Enforce non-reversible one-time decision rule
        if app.status in ["approved", "rejected"]:
            raise HTTPException(
                status_code=400,
                detail=f"This loan application has already been {app.status}. Decisions are permanent and cannot be modified or reversed."
            )

        raw_status = (status or "").strip().lower() if status else None

        if raw_status == "approved":
            is_complete, reason = self.is_application_complete(app)
            if not is_complete:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve and forward application: {reason}"
                )

            if bank_id is not None:
                bank = self.bank_repo.get_by_id(bank_id)
                if not bank:
                    raise HTTPException(status_code=404, detail="Selected bank not found")
                app.bankId = bank_id
            if description is not None:
                app.description = description.strip() or None
            app.status = "approved"

        elif raw_status == "rejected":
            if not description or not description.strip():
                raise HTTPException(status_code=400, detail="Rejection reason is required")
            app.description = description.strip()
            app.bankId = None
            app.status = "rejected"

        else:
            raise HTTPException(status_code=400, detail="Invalid decision. Application can only be approved or rejected.")

        saved = self.loan_app_repo.save(app)
        return self.serialize(saved)

    def delete_loan_application(self, application_id: int) -> dict:
        app = self.loan_app_repo.get_by_id(application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Loan application not found")
        self.loan_app_repo.soft_delete(app)
        return {"deleted_id": application_id}
