from typing import Dict, Any
from dsa_common.models import LoanApplication


def serialize_loan_application(app: LoanApplication, hide_commission: bool = False) -> Dict[str, Any]:
    """
    Serializes a LoanApplication and its sub-detail relationships into a clean dictionary.
    """
    cgd = app.clientGeneralDetail
    hld = app.homeLoanDetail
    cld = app.carLoanDetail
    pld = app.personalLoanDetail

    result: Dict[str, Any] = {
        "id": app.id,
        "applicationId": app.id,
        "name": app.name,
        "email": app.email,
        "mobile": app.mobile,
        "uniqueCustomerId": app.uniqueCustomerId,
        "productId": app.productId,
        "productName": app.product.name if app.product else None,
        "status": app.status or "Lead Created",
        "description": app.description,
        "agentId": app.agentId,
        "agentName": app.agent.name if app.agent else "Unassigned",
        "agentMobile": app.agent.mobile if app.agent else None,
        "agentEmail": app.agent.email if app.agent else None,
        "bankId": app.bankId,
        "bankName": app.bank.name if app.bank else "Not Selected",
        "bankLogo": getattr(app.bank, "logo", None) if app.bank else None,
    }

    if cgd:
        result["generalDetails"] = {
            "age": cgd.age,
            "gender": cgd.gender,
            "location": cgd.location,
            "employmentType": cgd.employment_type,
            "monthlyIncome": float(cgd.monthly_income) if cgd.monthly_income is not None else None,
            "monthlyObligation": float(cgd.monthly_obligation) if cgd.monthly_obligation is not None else None,
            "existingEmi": float(cgd.existing_emi) if cgd.existing_emi is not None else None,
            "cibilScore": cgd.cibil_score,
            "loanAmountRequired": float(cgd.loan_amount_required) if cgd.loan_amount_required is not None else None,
            "preferredTenureYears": cgd.preferred_tenure,
            "isSalaried": cgd.isSalaried,
        }

    if hld:
        result["homeLoanDetails"] = {
            "loanAmountRequired": float(hld.loan_amount_required) if hld.loan_amount_required is not None else None,
            "preferredTenure": hld.preferred_tenure,
            "propertyValue": float(hld.property_value) if hld.property_value is not None else None,
            "propertyLocation": hld.property_location,
            "propertyUsageType": hld.propertyUsageType,
            "downPayment": float(hld.down_payment) if hld.down_payment is not None else None,
            "propertyRequirement": hld.propertyRequirement,
            "propertyType": hld.propertyType,
            "propertyStatus": hld.propertyStatus,
            "femaleCoApplicant": hld.femaleCoApplicant,
            "propertyInsurance": hld.propertyInsurance,
            "applicantInsurance": hld.applicantInsurance,
        }

    if cld:
        result["carLoanDetails"] = {
            "loanAmountRequired": float(cld.loan_amount_required) if cld.loan_amount_required is not None else None,
            "preferredTenure": cld.preferred_tenure,
            "carValue": float(cld.car_value) if cld.car_value is not None else None,
            "downPayment": float(cld.down_payment) if cld.down_payment is not None else None,
            "newOrUsed": cld.new_or_used,
            "vehicleAge": cld.vehicle_age,
        }

    if pld:
        result["personalLoanDetails"] = {
            "loanAmountRequired": float(pld.loan_amount_required) if pld.loan_amount_required is not None else (float(pld.required_amount) if pld.required_amount is not None else None),
            "preferredTenure": pld.preferred_tenure,
            "loanPurpose": pld.loan_purpose,
            "requiredAmount": float(pld.required_amount) if pld.required_amount is not None else (float(pld.loan_amount_required) if pld.loan_amount_required is not None else None),
            "existingObligations": float(pld.existing_obligations) if pld.existing_obligations is not None else None,
        }

    return result
