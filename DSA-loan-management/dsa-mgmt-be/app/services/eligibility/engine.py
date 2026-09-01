"""
Master Loan Eligibility Orchestration Engine
Implements applicant data extraction, completeness validation, product dispatch, and result synthesis.
"""
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.loan_application import LoanApplication
from .home_loan import evaluate_home_loan_eligibility
from .personal_loan import evaluate_personal_loan_eligibility
from .car_loan import evaluate_car_loan_eligibility


def check_applicant_completeness(app: LoanApplication) -> Tuple[bool, List[str], str]:
    """
    Validates that user has filled all necessary personal, financial, and loan details.
    Returns (is_complete, missing_fields, product_type)
    """
    missing: List[str] = []
    
    # 1. Identify Product Type
    product_name = (app.product.name if app.product else "").lower()
    if "home" in product_name or "housing" in product_name:
        prod_type = "home_loan"
    elif "car" in product_name or "auto" in product_name or "vehicle" in product_name:
        prod_type = "car_loan"
    elif "personal" in product_name:
        prod_type = "personal_loan"
    else:
        # Fallback to linked detail records if product name isn't clear
        if app.homeLoanDetail:
            prod_type = "home_loan"
        elif app.carLoanDetail:
            prod_type = "car_loan"
        elif app.personalLoanDetail:
            prod_type = "personal_loan"
        else:
            prod_type = "personal_loan"

    # 2. General / Financial Details Validation
    cgd = app.clientGeneralDetail
    if not cgd:
        missing.append("Applicant Profile & Financial Information (Client General Details)")
    else:
        if not cgd.name and not app.name:
            missing.append("Applicant Name")
        if cgd.age is None:
            missing.append("Applicant Age")
        if cgd.monthly_income is None or float(cgd.monthly_income) <= 0:
            missing.append("Gross Monthly Income")
        if cgd.cibil_score is None:
            missing.append("CIBIL Credit Score")

    # 3. Product-Specific Details Validation
    if prod_type == "home_loan":
        hld = app.homeLoanDetail
        if not hld:
            missing.append("Home Loan & Property Details")
        else:
            if hld.property_value is None or float(hld.property_value) <= 0:
                missing.append("Property Estimated Value")
            req_amt_hl = float(hld.loan_amount_required) if hld.loan_amount_required is not None else (float(cgd.loan_amount_required) if cgd and cgd.loan_amount_required else 0.0)
            if req_amt_hl <= 0:
                missing.append("Required Loan Amount")
            tenure_hl = hld.preferred_tenure if hld.preferred_tenure is not None else (cgd.preferred_tenure if cgd else None)
            if tenure_hl is None or tenure_hl <= 0:
                missing.append("Preferred Loan Tenure")
    elif prod_type == "car_loan":
        cld = app.carLoanDetail
        if not cld:
            missing.append("Car Loan & Vehicle Details")
        else:
            if cld.car_value is None or float(cld.car_value) <= 0:
                missing.append("Vehicle Valuation / Quotation Price")
            if not cld.new_or_used:
                missing.append("Vehicle Condition (New / Used)")
            req_amt_cl = float(cld.loan_amount_required) if cld.loan_amount_required is not None else (float(cgd.loan_amount_required) if cgd and cgd.loan_amount_required else 0.0)
            if req_amt_cl <= 0:
                missing.append("Required Loan Amount")
            tenure_cl = cld.preferred_tenure if cld.preferred_tenure is not None else (cgd.preferred_tenure if cgd else None)
            if tenure_cl is None or tenure_cl <= 0:
                missing.append("Preferred Loan Tenure")
    elif prod_type == "personal_loan":
        pld = app.personalLoanDetail
        req_amt_pl = float(pld.loan_amount_required or pld.required_amount) if pld and (pld.loan_amount_required is not None or pld.required_amount is not None) else (float(cgd.loan_amount_required) if cgd and cgd.loan_amount_required else 0.0)
        if req_amt_pl <= 0:
            missing.append("Required Loan Amount")
        tenure_pl = pld.preferred_tenure if pld and pld.preferred_tenure is not None else (cgd.preferred_tenure if cgd else None)
        if tenure_pl is None or tenure_pl <= 0:
            missing.append("Preferred Loan Tenure")

    is_complete = len(missing) == 0
    return is_complete, missing, prod_type


def evaluate_loan_application(db: Session, application_id: int) -> Dict[str, Any]:
    """
    Main evaluation pipeline for a given loan application.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        return {
            "applicationId": application_id,
            "status": "ERROR",
            "message": f"Loan Application #{application_id} not found.",
            "isComplete": False,
            "missingFields": ["Invalid Application ID"],
        }

    is_complete, missing_fields, prod_type = check_applicant_completeness(app)

    # Basic Applicant Snapshot with both camelCase and snake_case keys for frontend compatibility
    cgd = app.clientGeneralDetail
    emp_type = (cgd.employment_type if cgd and cgd.employment_type else None) or ("Salaried" if cgd and cgd.isSalaried is not False else "Self-Employed")
    monthly_inc = float(cgd.monthly_income) if cgd and cgd.monthly_income else 0.0
    existing_e = float(cgd.existing_emi) if cgd and cgd.existing_emi else 0.0
    monthly_ob = float(cgd.monthly_obligation) if cgd and cgd.monthly_obligation else 0.0
    cibil_val = int(cgd.cibil_score) if cgd and cgd.cibil_score else None

    req_amt = 0.0
    pref_tenure = None
    if app.homeLoanDetail:
        if app.homeLoanDetail.loan_amount_required is not None:
            try:
                req_amt = float(app.homeLoanDetail.loan_amount_required)
            except (ValueError, TypeError):
                req_amt = 0.0
        if app.homeLoanDetail.preferred_tenure is not None:
            pref_tenure = app.homeLoanDetail.preferred_tenure
    elif app.carLoanDetail:
        if app.carLoanDetail.loan_amount_required is not None:
            try:
                req_amt = float(app.carLoanDetail.loan_amount_required)
            except (ValueError, TypeError):
                req_amt = 0.0
        if app.carLoanDetail.preferred_tenure is not None:
            pref_tenure = app.carLoanDetail.preferred_tenure
    elif app.personalLoanDetail:
        p_val = app.personalLoanDetail.loan_amount_required if app.personalLoanDetail.loan_amount_required is not None else app.personalLoanDetail.required_amount
        if p_val is not None:
            try:
                req_amt = float(p_val)
            except (ValueError, TypeError):
                req_amt = 0.0
        if app.personalLoanDetail.preferred_tenure is not None:
            pref_tenure = app.personalLoanDetail.preferred_tenure

    if req_amt == 0.0 and cgd and cgd.loan_amount_required is not None:
        try:
            req_amt = float(cgd.loan_amount_required)
        except (ValueError, TypeError):
            req_amt = 0.0
    if pref_tenure is None and cgd and cgd.preferred_tenure is not None:
        pref_tenure = cgd.preferred_tenure

    applicant_dict = {
        "name": (cgd.name if cgd and cgd.name else app.name) or "Applicant",
        "email": app.email,
        "mobile": app.mobile,
        "age": cgd.age if cgd else None,
        "gender": cgd.gender if cgd else None,
        "location": cgd.location if cgd else None,
        "employmentType": emp_type,
        "employment_type": emp_type,
        "monthlyIncome": monthly_inc,
        "monthly_income": monthly_inc,
        "existingEmi": existing_e,
        "existing_emi": existing_e,
        "monthlyObligation": monthly_ob,
        "monthly_obligation": monthly_ob,
        "cibilScore": cibil_val,
        "cibil_score": cibil_val,
        "loanAmountRequired": req_amt,
        "loan_amount_required": req_amt,
        "preferredTenure": pref_tenure,
        "preferred_tenure": pref_tenure,
        "isSalaried": cgd.isSalaried if cgd and cgd.isSalaried is not None else True,
    }

    product_display_name = app.product.name if app.product else (
        "Home Loan" if prod_type == "home_loan" else ("Car Loan" if prod_type == "car_loan" else "Personal Loan")
    )

    if not is_complete:
        return {
            "applicationId": app.id,
            "uniqueCustomerId": app.uniqueCustomerId,
            "customerName": applicant_dict["name"],
            "productName": product_display_name,
            "status": "INCOMPLETE_DETAILS",
            "missingFields": missing_fields,
        }

    # Execute product-specific evaluation
    if prod_type == "home_loan":
        hld = app.homeLoanDetail
        home_dict = {
            "property_value": float(hld.property_value) if hld and hld.property_value else 0.0,
            "property_location": hld.property_location if hld else "",
            "propertyType": hld.propertyType if hld else "",
            "propertyStatus": hld.propertyStatus if hld else "",
            "femaleCoApplicant": bool(hld.femaleCoApplicant) if hld and hld.femaleCoApplicant is not None else False,
        }
        result = evaluate_home_loan_eligibility(applicant_dict, home_dict)

    elif prod_type == "car_loan":
        cld = app.carLoanDetail
        car_dict = {
            "new_or_used": cld.new_or_used if cld else "new",
            "car_value": float(cld.car_value) if cld and cld.car_value else 0.0,
            "vehicle_age": int(cld.vehicle_age) if cld and cld.vehicle_age else 0,
            "down_payment": float(cld.down_payment) if cld and cld.down_payment else 0.0,
        }
        result = evaluate_car_loan_eligibility(applicant_dict, car_dict)

    else:
        pld = app.personalLoanDetail
        personal_dict = {
            "loan_purpose": pld.loan_purpose if pld else "Personal Requirement",
            "required_amount": float(pld.required_amount) if pld and pld.required_amount else applicant_dict["loanAmountRequired"],
        }
        result = evaluate_personal_loan_eligibility(applicant_dict, personal_dict)

    # Return concise, flat response with zero duplicate fields
    return {
        "applicationId": app.id,
        "uniqueCustomerId": app.uniqueCustomerId,
        "customerName": applicant_dict["name"],
        "email": applicant_dict["email"],
        "mobile": applicant_dict["mobile"],
        "age": applicant_dict["age"],
        "gender": applicant_dict["gender"],
        "location": applicant_dict["location"],
        "employmentType": applicant_dict["employmentType"],
        "productName": product_display_name,
        "productType": prod_type,
        "status": result.get("status", "NOT_ELIGIBLE"),

        # Financial & Underwriting Metrics
        "requestedAmount": result.get("requestedAmount", 0.0),
        "eligibleAmount": result.get("eligibleAmount", 0.0),
        "proposedEmi": result.get("proposedEmi", 0.0),
        "monthlyIncome": result.get("monthlyIncome", 0.0),
        "cibilScore": result.get("cibilScore"),
        "interestRatePct": result.get("interestRatePct", 0.0),
        "femaleRebateApplied": result.get("femaleRebateApplied", False),
        "tenureYears": result.get("tenureYears", 0),
        "foirPct": result.get("foirPct", 0.0),
        "ltvPct": result.get("ltvPct", 0.0),
        "maxAllowedLtvPct": result.get("maxAllowedLtvPct", 0.0),

        # Audit Lists
        "positiveFactors": result.get("positiveFactors", []),
        "reductionNotes": result.get("reductionNotes", []),
        "rejections": result.get("rejections", []),
        "missingFields": [],
    }
