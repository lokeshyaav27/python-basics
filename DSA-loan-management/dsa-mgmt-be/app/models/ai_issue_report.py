from sqlalchemy import Column, Integer, String, Text, JSON
from app.models.base import Base


class AIIssueReport(Base):
    __tablename__ = "ai_issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column("user_id", Integer, nullable=True, index=True)
    userName = Column("user_name", String(255), nullable=True)

    # Conversation context
    userQuery = Column("user_query", Text, nullable=False)
    aiResponse = Column("ai_response", Text, nullable=False)
    userRemarks = Column("user_remarks", Text, nullable=True)
    chatHistory = Column("chat_history", JSON, nullable=True)
    referencedDocs = Column("referenced_docs", JSON, nullable=True)

    # AI Diagnostic & Root Cause Suggestion
    aiRootCause = Column("ai_root_cause", Text, nullable=True)
    aiSuggestion = Column("ai_suggestion", Text, nullable=True)
