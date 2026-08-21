from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class ReportIssueRequest(BaseModel):
    userQuery: str = Field(..., min_length=1, description="The user prompt that was flagged")
    aiResponse: str = Field(..., min_length=1, description="The assistant response that had issues")
    issueCategory: str = Field(
        default="OTHER",
        description="Category: 'INACCURATE_CALCULATION', 'POLICY_MISMATCH', 'INSUFFICIENT_ANSWER', 'HALLUCINATION', 'OUTDATED_RATES', 'OTHER'",
    )
    userRemarks: Optional[str] = Field(None, description="Optional explanation or feedback from user")
    chatHistory: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Prior conversation messages")
    referencedDocs: Optional[List[str]] = Field(default_factory=list, description="Documents cited in the response")
    applicationId: Optional[int] = Field(None, description="Optional linked loan application ID")
    customerId: Optional[str] = Field(None, description="Optional linked customer identifier")
    agentId: Optional[int] = Field(None, description="Optional linked agent ID")


class ReportIssueResponse(BaseModel):
    reportId: int
    status: str
    message: str
    severity: str
    rootCauseSummary: Optional[str] = None


class AIIssueReportItem(BaseModel):
    id: int
    userId: Optional[int] = None
    userName: Optional[str] = None
    userRole: str
    userEmail: Optional[str] = None
    userMobile: Optional[str] = None
    applicationId: Optional[int] = None
    customerId: Optional[str] = None
    agentId: Optional[int] = None
    userQuery: str
    aiResponse: str
    issueCategory: str
    userRemarks: Optional[str] = None
    chatHistory: Optional[List[Dict[str, Any]]] = None
    referencedDocs: Optional[List[str]] = None
    aiRootCause: Optional[str] = None
    aiSuggestion: Optional[str] = None
    aiSeverity: str
    status: str
    adminNotes: Optional[str] = None
    resolvedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class UpdateIssueStatusRequest(BaseModel):
    status: str = Field(..., description="'OPEN', 'UNDER_REVIEW', 'RESOLVED', or 'IGNORED'")
    adminNotes: Optional[str] = Field(None, description="Administrative audit remarks")
