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
        if cgd.loan_amount_required is None or float(cgd.loan_amount_required) <= 0:
            # Check if required amount is present in product detail
            p_amt = float(app.personalLoanDetail.required_amount) if app.personalLoanDetail and app.personalLoanDetail.required_amount else 0.0
            if p_amt <= 0:
                missing.append("Requested Loan Amount")
        if cgd.preferred_tenure is None or int(cgd.preferred_tenure) <= 0:
            missing.append("Preferred Loan Tenure")

    # 3. Product-Specific Details Validation
    if prod_type == "home_loan":
        hld = app.homeLoanDetail
        if not hld:
            missing.append("Home Loan & Property Details")
        else:
            if hld.property_value is None or float(hld.property_value) <= 0:
                missing.append("Property Estimated Value")
    elif prod_type == "car_loan":
        cld = app.carLoanDetail
        if not cld:
            missing.append("Car Loan & Vehicle Details")
        else:
            if cld.car_value is None or float(cld.car_value) <= 0:
                missing.append("Vehicle Valuation / Quotation Price")
            if not cld.new_or_used:
                missing.append("Vehicle Condition (New / Used)")
    elif prod_type == "personal_loan":
        pld = app.personalLoanDetail
        # Personal loan only needs purpose optionally or required_amount if not in general
        pass

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

    # Basic Applicant Snapshot
    cgd = app.clientGeneralDetail
    applicant_dict = {
        "name": (cgd.name if cgd and cgd.name else app.name) or "Applicant",
        "email": app.email,
        "mobile": app.mobile,
        "age": cgd.age if cgd else None,
        "gender": cgd.gender if cgd else None,
        "location": cgd.location if cgd else None,
        "employment_type": cgd.employment_type if cgd else None,
        "monthly_income": float(cgd.monthly_income) if cgd and cgd.monthly_income else 0.0,
        "existing_emi": float(cgd.existing_emi) if cgd and cgd.existing_emi else 0.0,
        "monthly_obligation": float(cgd.monthly_obligation) if cgd and cgd.monthly_obligation else 0.0,
        "cibil_score": int(cgd.cibil_score) if cgd and cgd.cibil_score else None,
        "loan_amount_required": float(cgd.loan_amount_required) if cgd and cgd.loan_amount_required else (
            float(app.personalLoanDetail.required_amount) if app.personalLoanDetail and app.personalLoanDetail.required_amount else 0.0
        ),
        "preferred_tenure": int(cgd.preferred_tenure) if cgd and cgd.preferred_tenure else None,
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
            "productType": prod_type,
            "status": "INCOMPLETE_DETAILS",
            "isComplete": False,
            "message": "Applicant profile or loan requirement is incomplete. Please update the missing details to check eligibility.",
            "missingFields": missing_fields,
            "applicantData": applicant_dict,
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
            "required_amount": float(pld.required_amount) if pld and pld.required_amount else applicant_dict["loan_amount_required"],
        }
        result = evaluate_personal_loan_eligibility(applicant_dict, personal_dict)

    # Attach Contextual Metadata
    result["applicationId"] = app.id
    result["uniqueCustomerId"] = app.uniqueCustomerId
    result["customerName"] = applicant_dict["name"]
    result["productName"] = product_display_name
    result["productType"] = prod_type
    result["isComplete"] = True
    result["missingFields"] = []
    result["applicantData"] = applicant_dict

    return result
