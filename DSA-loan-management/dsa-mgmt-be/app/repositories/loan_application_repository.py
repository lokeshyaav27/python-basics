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
            loan_amount_required=data.get("loan_amount_required"),
            preferred_tenure=data.get("preferred_tenure"),
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
            "loan_amount_required",
            "preferred_tenure",
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
            loan_amount_required=data.get("loan_amount_required"),
            preferred_tenure=data.get("preferred_tenure"),
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
        for field in [
            "loan_amount_required",
            "preferred_tenure",
            "new_or_used",
            "car_value",
            "down_payment",
            "vehicle_age",
        ]:
            if field in data:
                setattr(instance, field, data[field])
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def create_personal_loan_detail(self, data: Dict[str, Any]) -> PersonalLoanDetail:
        req_val = data.get("loan_amount_required") if data.get("loan_amount_required") is not None else data.get("required_amount")
        record = PersonalLoanDetail(
            loan_amount_required=req_val,
            preferred_tenure=data.get("preferred_tenure"),
            loan_purpose=data.get("loan_purpose"),
            other=data.get("other"),
            required_amount=req_val,
            existing_obligations=data.get("existing_obligations"),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update_personal_loan_detail(
        self, instance: PersonalLoanDetail, data: Dict[str, Any]
    ) -> PersonalLoanDetail:
        for field in [
            "loan_amount_required",
            "preferred_tenure",
            "loan_purpose",
            "other",
            "required_amount",
            "existing_obligations",
        ]:
            if field in data:
                setattr(instance, field, data[field])
        if "loan_amount_required" in data and "required_amount" not in data:
            instance.required_amount = data["loan_amount_required"]
        elif "required_amount" in data and "loan_amount_required" not in data:
            instance.loan_amount_required = data["required_amount"]

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
        home_loan_detail_id: Optional[int] = None,
        car_loan_detail_id: Optional[int] = None,
        personal_loan_detail_id: Optional[int] = None,
        client_general_detail_id: Optional[int] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
    ) -> LoanApplication:
        record = LoanApplication(
            name=name,
            email=email,
            mobile=mobile,
            uniqueCustomerId=unique_customer_id,
            productId=product_id,
            agentId=agent_id,
            bankId=bank_id,
            homeLoanDetailId=home_loan_detail_id,
            carLoanDetailId=car_loan_detail_id,
            personalLoanDetailId=personal_loan_detail_id,
            clientGeneralDetailTableId=client_general_detail_id,
            description=description,
            status=status,
            isActive=True,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

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

    def list_by_role(
        self,
        role: str,
        user_id: Optional[int] = None,
        agent_id: Optional[int] = None,
        unique_customer_id: Optional[str] = None,
        mobile: Optional[str] = None,
        include_inactive: bool = False,
    ) -> List[LoanApplication]:
        query = self.db.query(LoanApplication)
        if not include_inactive:
            query = query.filter(LoanApplication.isActive != False)

        if role == "agent" and user_id is not None:
            query = query.filter(LoanApplication.agentId == user_id)
        elif role == "customer":
            ident_filters = []
            if unique_customer_id:
                ident_filters.append(LoanApplication.uniqueCustomerId == unique_customer_id)
            if mobile:
                ident_filters.append(LoanApplication.mobile == mobile)
            if user_id:
                ident_filters.append(LoanApplication.id == user_id)
            if ident_filters:
                query = query.filter(or_(*ident_filters))
            else:
                return []
        elif role == "admin" and agent_id is not None:
            query = query.filter(LoanApplication.agentId == agent_id)

        return query.order_by(LoanApplication.id.desc()).all()

    def update_application(
        self, instance: LoanApplication, data: Dict[str, Any]
    ) -> LoanApplication:
        for field in ["name", "email", "mobile", "productId", "agentId", "bankId", "status", "description", "isActive"]:
            if field in data:
                setattr(instance, field, data[field])
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def get_commission_analytics(
        self,
        agent_id: Optional[int] = None,
        bank_id: Optional[int] = None,
        product_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calculates portfolio and DSA commission summaries across applications."""
        query = self.db.query(LoanApplication).filter(LoanApplication.isActive != False)
        if agent_id is not None:
            query = query.filter(LoanApplication.agentId == agent_id)
        if bank_id is not None:
            query = query.filter(LoanApplication.bankId == bank_id)
        if product_id is not None:
            query = query.filter(LoanApplication.productId == product_id)
        if status and status.lower() != "all":
            query = query.filter(LoanApplication.status.ilike(f"%{status}%"))

        apps = query.all()
        links = self.db.query(ProductBankLink).filter(ProductBankLink.isActive != False).all()
        link_comm_map: Dict[Tuple[int, int], float] = {
            (l.bankId, l.productId): float(l.commission) if l.commission is not None else 1.0
            for l in links
        }

        total_disbursed_commission = 0.0
        total_pipeline_commission = 0.0
        total_loan_volume = 0.0
        bank_breakdown: Dict[str, Dict[str, Any]] = {}
        agent_breakdown: Dict[str, Dict[str, Any]] = {}
        product_breakdown: Dict[str, Dict[str, Any]] = {}
        detailed_items = []

        for app in apps:
            cgd = app.clientGeneralDetail
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
            elif cgd and cgd.loan_amount_required is not None:
                try:
                    loan_amt = float(cgd.loan_amount_required)
                except (ValueError, TypeError):
                    loan_amt = 0.0

            b_id = app.bankId
            p_id = app.productId
            comm_pct = link_comm_map.get((b_id, p_id), 1.0 if b_id else 0.0)
            comm_amt = (loan_amt * comm_pct) / 100.0 if comm_pct > 0 else 0.0

            total_loan_volume += loan_amt
            app_status = app.status or "Lead Created"
            is_realized = any(kw in app_status.lower() for kw in ["disbursed", "approved", "forwarded", "sanction"])

            if is_realized:
                total_disbursed_commission += comm_amt
            total_pipeline_commission += comm_amt

            # Bank breakdown
            b_name = app.bank.name if app.bank else "Unassigned / In Evaluation"
            if b_name not in bank_breakdown:
                bank_breakdown[b_name] = {"bankName": b_name, "count": 0, "totalCommission": 0.0, "totalLoanVolume": 0.0}
            bank_breakdown[b_name]["count"] += 1
            bank_breakdown[b_name]["totalCommission"] += comm_amt
            bank_breakdown[b_name]["totalLoanVolume"] += loan_amt

            # Agent breakdown
            a_name = app.agent.name if app.agent else "Unassigned"
            if a_name not in agent_breakdown:
                agent_breakdown[a_name] = {"agentName": a_name, "count": 0, "totalCommission": 0.0}
            agent_breakdown[a_name]["count"] += 1
            agent_breakdown[a_name]["totalCommission"] += comm_amt

            # Product breakdown
            p_name = app.product.name if app.product else "General Loan"
            if p_name not in product_breakdown:
                product_breakdown[p_name] = {"productName": p_name, "count": 0, "totalCommission": 0.0}
            product_breakdown[p_name]["count"] += 1
            product_breakdown[p_name]["totalCommission"] += comm_amt

            detailed_items.append({
                "applicationId": app.id,
                "customerName": app.name,
                "productName": p_name,
                "bankName": b_name,
                "agentName": a_name,
                "status": app_status,
                "loanAmount": loan_amt,
                "commissionRatePct": comm_pct,
                "estimatedCommissionAmount": round(comm_amt, 2),
            })

        return {
            "totalApplicationsAnalyzed": len(apps),
            "totalLoanVolume": round(total_loan_volume, 2),
            "totalRealizedCommission": round(total_disbursed_commission, 2),
            "totalPipelineCommission": round(total_pipeline_commission, 2),
            "bankBreakdown": list(bank_breakdown.values()),
            "agentBreakdown": list(agent_breakdown.values()),
            "productBreakdown": list(product_breakdown.values()),
            "recentApplications": detailed_items[:15],
        }

    def get_portfolio_kpis(
        self,
        product_type: Optional[str] = None,
        agent_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        query = self.db.query(LoanApplication).filter(LoanApplication.isActive != False)
        if agent_id is not None:
            query = query.filter(LoanApplication.agentId == agent_id)

        apps = query.all()
        if product_type:
            pt = product_type.lower()
            apps = [a for a in apps if a.product and pt in a.product.name.lower()]

        total_count = len(apps)
        status_dist: Dict[str, int] = {}
        product_dist: Dict[str, int] = {}
        total_requested = 0.0
        unique_customers = set()

        for a in apps:
            st = a.status or "Lead Created"
            status_dist[st] = status_dist.get(st, 0) + 1

            p_name = a.product.name if a.product else "Unspecified"
            product_dist[p_name] = product_dist.get(p_name, 0) + 1

            if a.uniqueCustomerId:
                unique_customers.add(a.uniqueCustomerId)
            elif a.mobile:
                unique_customers.add(a.mobile)

            loan_amt = 0.0
            if a.homeLoanDetail and a.homeLoanDetail.loan_amount_required is not None:
                try:
                    loan_amt = float(a.homeLoanDetail.loan_amount_required)
                except (ValueError, TypeError):
                    loan_amt = 0.0
            elif a.carLoanDetail and a.carLoanDetail.loan_amount_required is not None:
                try:
                    loan_amt = float(a.carLoanDetail.loan_amount_required)
                except (ValueError, TypeError):
                    loan_amt = 0.0
            elif a.personalLoanDetail and (a.personalLoanDetail.loan_amount_required is not None or a.personalLoanDetail.required_amount is not None):
                try:
                    loan_amt = float(a.personalLoanDetail.loan_amount_required or a.personalLoanDetail.required_amount)
                except (ValueError, TypeError):
                    loan_amt = 0.0
            elif a.clientGeneralDetail and a.clientGeneralDetail.loan_amount_required is not None:
                try:
                    loan_amt = float(a.clientGeneralDetail.loan_amount_required)
                except (ValueError, TypeError):
                    loan_amt = 0.0

            total_requested += loan_amt

        avg_amount = round(total_requested / total_count, 2) if total_count > 0 else 0.0

        return {
            "totalLoanApplications": total_count,
            "totalUniqueBorrowers": len(unique_customers),
            "totalRequestedVolume": round(total_requested, 2),
            "averageLoanAmount": avg_amount,
            "statusDistribution": status_dist,
            "productDistribution": product_dist,
        }

