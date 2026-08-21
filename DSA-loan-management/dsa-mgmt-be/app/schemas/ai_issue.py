from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class ReportIssueRequest(BaseModel):
    userQuery: str = Field(..., min_length=1, description="The user prompt that was flagged")
    aiResponse: str = Field(..., min_length=1, description="The assistant response that had issues")
    userRemarks: Optional[str] = Field(None, description="Optional explanation or feedback from user")
    chatHistory: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Prior conversation messages")
    referencedDocs: Optional[List[str]] = Field(default_factory=list, description="Documents cited in the response")


class ReportIssueResponse(BaseModel):
    reportId: int
    message: str
    rootCauseSummary: Optional[str] = None


class AIIssueReportItem(BaseModel):
    id: int
    userId: Optional[int] = None
    userName: Optional[str] = None
    userQuery: str
    aiResponse: str
    userRemarks: Optional[str] = None
    chatHistory: Optional[List[Dict[str, Any]]] = None
    referencedDocs: Optional[List[str]] = None
    aiRootCause: Optional[str] = None
    aiSuggestion: Optional[str] = None

    class Config:
        from_attributes = True
