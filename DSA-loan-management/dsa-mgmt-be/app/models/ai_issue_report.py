from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.models.base import Base


class AIIssueReport(Base):
    __tablename__ = "ai_issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column("user_id", Integer, nullable=True, index=True)
    userName = Column("user_name", String(255), nullable=True)
    userRole = Column("user_role", String(64), nullable=False, default="customer")
    userEmail = Column("user_email", String(255), nullable=True)
    userMobile = Column("user_mobile", String(32), nullable=True)

    # Optional linked contexts
    applicationId = Column("application_id", Integer, nullable=True, index=True)
    customerId = Column("customer_id", String(128), nullable=True, index=True)
    agentId = Column("agent_id", Integer, nullable=True, index=True)

    # Conversation context
    userQuery = Column("user_query", Text, nullable=False)
    aiResponse = Column("ai_response", Text, nullable=False)
    issueCategory = Column("issue_category", String(128), nullable=False, default="OTHER")
    userRemarks = Column("user_remarks", Text, nullable=True)
    chatHistory = Column("chat_history", JSON, nullable=True)
    referencedDocs = Column("referenced_docs", JSON, nullable=True)

    # AI Diagnostic & Root Cause Suggestion
    aiRootCause = Column("ai_root_cause", Text, nullable=True)
    aiSuggestion = Column("ai_suggestion", Text, nullable=True)
    aiSeverity = Column("ai_severity", String(32), nullable=False, default="MEDIUM")

    # Issue Lifecycle Status: OPEN, UNDER_REVIEW, RESOLVED, IGNORED
    status = Column(String(32), nullable=False, default="OPEN", index=True)
    adminNotes = Column("admin_notes", Text, nullable=True)
    resolvedAt = Column("resolved_at", DateTime(timezone=True), nullable=True)

    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now(), index=True)
    updatedAt = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    isActive = Column("is_active", Boolean, nullable=False, default=True)
