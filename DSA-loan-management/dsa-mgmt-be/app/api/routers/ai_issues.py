import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.db.session import get_db
from dsa_common.models import AIIssueReport
from app.schemas.ai_issue import (
    ReportIssueRequest,
    ReportIssueResponse,
    AIIssueReportItem,
)
from app.ai.services.ai_issue_service import ai_issue_service
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

logger = logging.getLogger("ai_issues_router")
logger.setLevel(logging.INFO)

router = APIRouter()


@router.post("/report")
def report_ai_issue(
    req: ReportIssueRequest,
    current_user: CurrentUser = Depends(require_role(["admin", "agent", "customer"])),
    db: Session = Depends(get_db),
):
    """
    Submits a reported issue regarding an inaccurate or insufficient AI Underwriting response.
    Analyzes the issue using the AI Issue Diagnostic Service and persists the full audit record.
    """
    logger.info(
        f"Reporting AI Issue from user '{current_user.name}' ({current_user.role})"
    )

    # 1. Run AI Root-Cause Diagnostic & Suggestion Service
    root_cause, suggestion = ai_issue_service.analyze_reported_issue(
        user_query=req.userQuery,
        ai_response=req.aiResponse,
        user_remarks=req.userRemarks,
        chat_history=req.chatHistory,
    )

    # 2. Persist in Database
    report = AIIssueReport(
        userId=current_user.id,
        userName=current_user.name,
        userQuery=req.userQuery,
        aiResponse=req.aiResponse,
        userRemarks=req.userRemarks,
        chatHistory=req.chatHistory,
        referencedDocs=req.referencedDocs,
        aiRootCause=root_cause,
        aiSuggestion=suggestion,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info(f"AI Issue Report #{report.id} created successfully")

    response_payload = ReportIssueResponse(
        reportId=report.id,
        message="Your issue report has been recorded. Our team has been notified.",
        rootCauseSummary=root_cause,
    )

    return success_response(
        result=response_payload.dict(),
        message="Issue report recorded successfully",
    )


@router.get("")
def list_ai_issues(
    search: Optional[str] = Query(None, description="Search term in userQuery, aiResponse, or userName"),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Lists all reported AI chat issues for administrative review (Admin only).
    """
    query = db.query(AIIssueReport)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AIIssueReport.userQuery.ilike(s_term),
                AIIssueReport.aiResponse.ilike(s_term),
                AIIssueReport.userName.ilike(s_term),
                AIIssueReport.userRemarks.ilike(s_term),
                AIIssueReport.aiRootCause.ilike(s_term),
            )
        )

    reports = query.order_by(desc(AIIssueReport.id)).all()

    serialized_items = [
        AIIssueReportItem.from_orm(r).dict() for r in reports
    ]

    return success_response(
        result={
            "total": len(serialized_items),
            "issues": serialized_items,
        },
        message="AI issues retrieved successfully",
    )


@router.get("/{issue_id}")
def get_ai_issue_detail(
    issue_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Retrieves specific reported issue details by ID (Admin only).
    """
    report = db.query(AIIssueReport).filter(AIIssueReport.id == issue_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"AI Issue Report #{issue_id} not found.")

    return success_response(
        result=AIIssueReportItem.from_orm(report).dict(),
        message="AI issue detail retrieved successfully",
    )
