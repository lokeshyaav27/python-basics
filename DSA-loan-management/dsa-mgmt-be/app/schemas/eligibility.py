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
    employmentType: Optional[str] = None
    monthlyIncome: Optional[float] = 0.0
    cibilScore: Optional[int] = None
    loanAmountRequired: Optional[float] = 0.0
    preferredTenure: Optional[int] = None


class EligibilityResponse(BaseModel):
    applicationId: int
    uniqueCustomerId: Optional[str] = None
    customerName: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    employmentType: Optional[str] = None
    productName: Optional[str] = None
    productType: Optional[str] = None
    status: str  # ELIGIBLE | PARTIALLY_ELIGIBLE | NOT_ELIGIBLE | INCOMPLETE_DETAILS

    # Financial & Underwriting metrics consumed by UI
    requestedAmount: Optional[float] = 0.0
    eligibleAmount: Optional[float] = 0.0
    proposedEmi: Optional[float] = 0.0
    monthlyIncome: Optional[float] = 0.0
    cibilScore: Optional[int] = None
    interestRatePct: Optional[float] = 0.0
    femaleRebateApplied: Optional[bool] = False
    tenureYears: Optional[int] = 0
    preferredTenure: Optional[int] = None
    foirPct: Optional[float] = 0.0
    ltvPct: Optional[float] = None
    maxAllowedLtvPct: Optional[float] = None

    # Audit & Underwriting lists
    positiveFactors: List[str] = []
    reductionNotes: List[str] = []
    rejections: List[str] = []
    missingFields: List[str] = []

    # AI Summary
    aiExplanation: Optional[str] = None
