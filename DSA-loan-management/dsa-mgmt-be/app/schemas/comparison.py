from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class InsuranceDetail(BaseModel):
    isProvided: str = "Yes"  # "Yes" | "No"
    percentage: Optional[float] = None
    amount: Optional[float] = None
    description: Optional[str] = None


class BankComparisonItem(BaseModel):
    bankId: int
    bankName: str
    bankLogo: Optional[str] = None
    isPrivate: bool = False
    isNationalize: bool = False
    isNbfc: bool = False
    
    # Link & Policy document flags
    isLinked: bool = True
    hasPolicyDocs: bool = True
    policyStatusNote: Optional[str] = None
    
    # Comparison Data Points
    status: str = "N/A"  # "ELIGIBLE" | "PARTIALLY_ELIGIBLE" | "NOT_ELIGIBLE" | "N/A"
    reasonForRejection: List[str] = []
    
    roi: Optional[float] = None
    baseRoi: Optional[float] = None
    loanAmount: Optional[float] = None
    requestedAmount: Optional[float] = None
    emi: Optional[float] = None
    tenure: Optional[str] = None
    tenureYears: Optional[int] = None
    
    benefitForFemaleCoApplicant: Optional[str] = None
    femaleRebateApplied: bool = False
    
    propertyInsurance: Optional[InsuranceDetail] = None
    applicantInsurance: Optional[InsuranceDetail] = None
    
    processingFee: Optional[str] = None
    dsaCommission: Optional[str] = None  # Populated ONLY for agent/admin, None for customer
    commissionPct: Optional[float] = None
    commissionAmount: Optional[float] = None
    
    additionalNote: Optional[str] = None
    policyExcerpts: List[str] = []


class BankComparisonResponse(BaseModel):
    applicationId: int
    uniqueCustomerId: Optional[str] = None
    customerName: Optional[str] = None
    productName: Optional[str] = None
    productType: Optional[str] = None
    requestedAmount: Optional[float] = 0.0
    cibilScore: Optional[int] = None
    monthlyIncome: Optional[float] = 0.0
    
    banks: List[BankComparisonItem]
    aiComparativeAnalysis: Optional[str] = None
    disclaimer: str = (
        "Comparison data is evaluated against bank policy guidelines and current loan parameters. "
        "Terms are subject to bank credit approval and document verification."
    )


class BankComparisonRequest(BaseModel):
    applicationId: int = Field(..., description="Loan Application ID")
    bankIds: List[int] = Field(..., max_length=2, min_length=1, description="List of bank IDs to compare (Max 2)")
