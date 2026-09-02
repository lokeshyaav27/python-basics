"""
Master Loan Eligibility Orchestration Engine
Dispatches evaluation requests to specific product underwriting calculators.
"""
from typing import Dict, Any, Tuple, List
from sqlalchemy.orm import Session
from dsa_common.models.loan_application import LoanApplication
from dsa_common.services.eligibility.home_loan import evaluate_home_loan_eligibility
from dsa_common.services.eligibility.car_loan import evaluate_car_loan_eligibility
from dsa_common.services.eligibility.personal_loan import evaluate_personal_loan_eligibility


def check_applicant_completeness(app: LoanApplication) -> Tuple[bool, List[str], str]:
    """
    Validates whether loan application has required core financial & collateral inputs.
    """
    missing_fields: List[str] = []
    cgd = app.clientGeneralDetail

    if not cgd:
        return False, ["Client General Financial Details (Income, CIBIL, Age)"], "unknown"

    if not cgd.age:
        missing_fields.append("Applicant Age")
    if not cgd.monthly_income:
        missing_fields.append("Monthly Income")
    if cgd.cibil_score is None:
        missing_fields.append("CIBIL Score")

    p_name = app.product.name.lower() if app.product else ""

    if "home" in p_name or "housing" in p_name:
        prod_type = "home_loan"
        hld = app.homeLoanDetail
        if not hld:
            missing_fields.append("Home Loan Property & Collateral Details")
        else:
            if not hld.property_value:
                missing_fields.append("Property Valuation (Home Loan)")
            if not hld.loan_amount_required and not cgd.loan_amount_required:
                missing_fields.append("Required Loan Amount")
    elif "car" in p_name or "auto" in p_name:
        prod_type = "car_loan"
        cld = app.carLoanDetail
        if not cld:
            missing_fields.append("Car Loan Vehicle Details")
        else:
            if not cld.car_value:
                missing_fields.append("Vehicle Valuation (Car Loan)")
            if not cld.loan_amount_required and not cgd.loan_amount_required:
                missing_fields.append("Required Loan Amount")
    else:
        prod_type = "personal_loan"
        pld = app.personalLoanDetail
        req_val = pld.loan_amount_required if (pld and pld.loan_amount_required is not None) else (pld.required_amount if pld else None)
        if not req_val and not cgd.loan_amount_required:
            missing_fields.append("Required Loan Amount")

    is_complete = len(missing_fields) == 0
    return is_complete, missing_fields, prod_type


def evaluate_loan_application(db: Session, application_id: int) -> Dict[str, Any]:
    """
    Master dispatcher for evaluating loan application eligibility against underwriting benchmarks.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise ValueError(f"Loan Application #{application_id} not found.")

    is_complete, missing_fields, prod_type = check_applicant_completeness(app)

    if not is_complete:
        return {
            "applicationId": app.id,
            "uniqueCustomerId": app.uniqueCustomerId,
            "customerName": app.name,
            "status": "INCOMPLETE_DETAILS",
            "overallStatus": "INCOMPLETE_DETAILS",
            "eligibleLoanAmount": 0.0,
            "maxEligibleAmount": 0.0,
            "missingRequiredFields": missing_fields,
            "rejectionReasons": [f"Missing required underwriting parameter(s): {', '.join(missing_fields)}"],
            "reductionReasons": [],
            "positiveFactors": [],
        }

    if prod_type == "home_loan":
        result = evaluate_home_loan_eligibility(app)
    elif prod_type == "car_loan":
        result = evaluate_car_loan_eligibility(app)
    else:
        result = evaluate_personal_loan_eligibility(app)

    result["uniqueCustomerId"] = app.uniqueCustomerId
    result["customerName"] = app.name
    return result
