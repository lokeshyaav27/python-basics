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

    # Basic Applicant Snapshot with both camelCase and snake_case keys for frontend compatibility
    cgd = app.clientGeneralDetail
    emp_type = (cgd.employment_type if cgd and cgd.employment_type else None) or ("Salaried" if cgd and cgd.isSalaried is not False else "Self-Employed")
    monthly_inc = float(cgd.monthly_income) if cgd and cgd.monthly_income else 0.0
    existing_e = float(cgd.existing_emi) if cgd and cgd.existing_emi else 0.0
    monthly_ob = float(cgd.monthly_obligation) if cgd and cgd.monthly_obligation else 0.0
    cibil_val = int(cgd.cibil_score) if cgd and cgd.cibil_score else None
    req_amt = float(cgd.loan_amount_required) if cgd and cgd.loan_amount_required else (
        float(app.personalLoanDetail.required_amount) if app.personalLoanDetail and app.personalLoanDetail.required_amount else 0.0
    )
    pref_tenure = int(cgd.preferred_tenure) if cgd and cgd.preferred_tenure else None

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
            "productType": prod_type,
            "status": "INCOMPLETE_DETAILS",
            "overallStatus": "INCOMPLETE_DETAILS",
            "isComplete": False,
            "message": "Applicant profile or loan requirement is incomplete. Please update the missing details to check eligibility.",
            "summary": "Applicant profile is incomplete. Please fill all required fields.",
            "missingFields": missing_fields,
            "applicantData": applicant_dict,
            "banks": [],
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

    # 4. Evaluate Partner Banks offering this product
    from app.models.product_bank_link import ProductBankLink

    banks_evaluated = []
    if app.productId:
        links = (
            db.query(ProductBankLink)
            .filter(ProductBankLink.productId == app.productId, ProductBankLink.isActive != False)
            .all()
        )
        for link in links:
            bank = link.bank
            if not bank or bank.isActive is False:
                continue

            cibil_num = cibil_val or 0
            foir_val = float(result.get("foirPct", 0.0))
            ltv_val = float(result.get("ltvPct", 0.0))
            max_ltv_val = float(result.get("maxAllowedLtvPct", 80.0))
            applicant_age = applicant_dict.get("age") or 30

            cibil_passed = cibil_num >= 700
            foir_passed = foir_val <= 65.0
            ltv_passed = ltv_val <= max_ltv_val
            age_passed = applicant_age <= 60

            all_passed = cibil_passed and foir_passed and ltv_passed and age_passed
            partial_passed = cibil_passed and age_passed and (foir_passed or ltv_passed)

            bank_status = "ELIGIBLE" if all_passed else ("PARTIALLY_ELIGIBLE" if partial_passed else "NOT_ELIGIBLE")

            bank_notes = []
            if not cibil_passed:
                bank_notes.append(f"CIBIL score ({cibil_num}) is below bank benchmark (700).")
            if not foir_passed:
                bank_notes.append(f"FOIR ({foir_val:.1f}%) exceeds maximum permissible ceiling (65%).")
            if not ltv_passed:
                bank_notes.append(f"LTV ({ltv_val:.1f}%) exceeds maximum limit ({max_ltv_val:.0f}%).")
            if all_passed:
                bank_notes.append(f"Pre-approved under standard {product_display_name} policy guidelines.")

            banks_evaluated.append({
                "bankId": bank.id,
                "bankName": bank.name,
                "bankLogo": bank.logo,
                "status": bank_status,
                "maxLtv": max_ltv_val,
                "checklist": [
                    {"criteria": "CIBIL Score Benchmark (>= 700)", "passed": cibil_passed},
                    {"criteria": "Debt-to-Income / FOIR (<= 65%)", "passed": foir_passed},
                    {"criteria": f"Loan-to-Value Ratio (<= {max_ltv_val:.0f}%)", "passed": ltv_passed},
                    {"criteria": "Applicant Age & Maximum Tenure Limit", "passed": age_passed},
                ],
                "notes": bank_notes,
            })

    result["banks"] = banks_evaluated

    # Summary Text & Overall Status
    rejections = result.get("rejections", [])
    if len(rejections) > 0:
        result["summary"] = rejections[0]
    elif result.get("status") == "ELIGIBLE":
        result["summary"] = f"Congratulations! {applicant_dict['name']} meets underwriting guidelines for {product_display_name}."
    else:
        result["summary"] = "Applicant is eligible under adjusted loan amount/tenure terms."

    result["overallStatus"] = result.get("status")

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
