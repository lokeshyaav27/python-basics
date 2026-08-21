from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")


class ChatAuthContext(BaseModel):
    role: str = Field("customer", description="User role: 'admin', 'agent', or 'customer'")
    userId: Optional[int] = Field(None, description="Database ID of the logged-in agent or customer")
    identifier: Optional[str] = Field(None, description="Unique customer ID, mobile, or email")
    name: Optional[str] = Field(None, description="User's full name")
    email: Optional[str] = Field(None, description="User's email address")
    mobile: Optional[str] = Field(None, description="User's mobile number")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Latest user message or query")
    history: List[ChatMessage] = Field(default_factory=list, description="Previous conversation messages for multi-turn context")
    authContext: Optional[ChatAuthContext] = Field(default=None, description="Logged-in caller's authentication & authorization context")
    applicationId: Optional[int] = Field(None, description="Optional linked loan application context")
    customerId: Optional[str] = Field(None, description="Optional linked customer context")
    agentId: Optional[int] = Field(None, description="Optional linked agent context (Admin only)")


class ToolExecutionAudit(BaseModel):
    toolName: str
    arguments: Dict[str, Any]
    status: str = Field(..., description="'SUCCESS', 'DENIED', 'VALIDATION_ERROR', or 'NOT_FOUND'")
    summary: str
    timestamp: str


class ChatResponse(BaseModel):
    response: str
    referencedDocs: List[str] = Field(default_factory=list)
    modelUsed: Optional[str] = None
    toolUsed: Optional[str] = None
    clarificationNeeded: bool = False
    requiresConfirmation: bool = False
