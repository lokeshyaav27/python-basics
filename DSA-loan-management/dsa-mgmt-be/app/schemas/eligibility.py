from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class EligibilityEvaluateRequest(BaseModel):
    applicationId: int = Field(..., description="ID of the loan application to evaluate")


class ApplicantSnapshot(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    monthly_income: Optional[float] = 0.0
    existing_emi: Optional[float] = 0.0
    monthly_obligation: Optional[float] = 0.0
    cibil_score: Optional[int] = None
    loan_amount_required: Optional[float] = 0.0
    preferred_tenure: Optional[int] = None


class EligibilityResponse(BaseModel):
    applicationId: int
    uniqueCustomerId: Optional[str] = None
    customerName: Optional[str] = None
    productName: Optional[str] = None
    productType: Optional[str] = None
    status: str  # ELIGIBLE | PARTIALLY_ELIGIBLE | NOT_ELIGIBLE | INCOMPLETE_DETAILS | ERROR
    isComplete: bool = True
    message: Optional[str] = None
    missingFields: List[str] = []
    
    # Financial metrics
    requestedAmount: Optional[float] = 0.0
    eligibleAmount: Optional[float] = 0.0
    proposedEmi: Optional[float] = 0.0
    interestRatePct: Optional[float] = 0.0
    baseInterestRatePct: Optional[float] = None
    femaleRebateApplied: Optional[bool] = False
    tenureYears: Optional[int] = 0
    foirPct: Optional[float] = 0.0
    maxAllowedFoirPct: Optional[float] = 65.0
    ltvPct: Optional[float] = None
    maxAllowedLtvPct: Optional[float] = None
    propertyValue: Optional[float] = None
    carValue: Optional[float] = None
    
    # Audit & Underwriting lists
    rejections: List[str] = []
    positiveFactors: List[str] = []
    reductionNotes: List[str] = []
    
    # AI Summary
    aiExplanation: Optional[str] = None
    applicantData: Optional[Dict[str, Any]] = None
