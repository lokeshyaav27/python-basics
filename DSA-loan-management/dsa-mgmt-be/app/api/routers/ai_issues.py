import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.db.session import get_db
from app.models.ai_issue_report import AIIssueReport
from app.schemas.ai_issue import (
    ReportIssueRequest,
    ReportIssueResponse,
    AIIssueReportItem,
    UpdateIssueStatusRequest,
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
        f"Reporting AI Issue from user '{current_user.name}' ({current_user.role}) | Category='{req.issueCategory}'"
    )

    # 1. Run AI Root-Cause Diagnostic & Suggestion Service
    root_cause, suggestion, severity = ai_issue_service.analyze_reported_issue(
        user_query=req.userQuery,
        ai_response=req.aiResponse,
        issue_category=req.issueCategory,
        user_remarks=req.userRemarks,
        chat_history=req.chatHistory,
        user_role=current_user.role,
    )

    # 2. Persist in Database
    report = AIIssueReport(
        userId=current_user.id,
        userName=current_user.name,
        userRole=current_user.role,
        userEmail=current_user.email,
        userMobile=current_user.mobile,
        applicationId=req.applicationId,
        customerId=req.customerId,
        agentId=req.agentId,
        userQuery=req.userQuery,
        aiResponse=req.aiResponse,
        issueCategory=req.issueCategory,
        userRemarks=req.userRemarks,
        chatHistory=req.chatHistory,
        referencedDocs=req.referencedDocs,
        aiRootCause=root_cause,
        aiSuggestion=suggestion,
        aiSeverity=severity,
        status="OPEN",
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info(f"AI Issue Report #{report.id} created successfully with severity='{severity}'")

    response_payload = ReportIssueResponse(
        reportId=report.id,
        status="OPEN",
        message="Your issue report has been recorded. Our underwriting tech & credit team has been notified.",
        severity=severity,
        rootCauseSummary=root_cause,
    )

    return success_response(
        result=response_payload.dict(),
        message="Issue report recorded successfully",
    )


@router.get("")
def list_ai_issues(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, UNDER_REVIEW, RESOLVED, IGNORED"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term in userQuery, aiResponse, or userName"),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Lists all reported AI chat issues for administrative quality auditing (Admin only).
    """
    query = db.query(AIIssueReport).filter(AIIssueReport.isActive != False)

    if status and status.upper() != "ALL":
        query = query.filter(AIIssueReport.status == status.upper())

    if severity and severity.upper() != "ALL":
        query = query.filter(AIIssueReport.aiSeverity == severity.upper())

    if category and category.upper() != "ALL":
        query = query.filter(AIIssueReport.issueCategory == category)

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

    reports = query.order_by(desc(AIIssueReport.createdAt)).all()

    # Calculate overview stats
    all_active = db.query(AIIssueReport).filter(AIIssueReport.isActive != False).all()
    stats = {
        "total": len(all_active),
        "open": sum(1 for r in all_active if r.status == "OPEN"),
        "underReview": sum(1 for r in all_active if r.status == "UNDER_REVIEW"),
        "resolved": sum(1 for r in all_active if r.status == "RESOLVED"),
        "highOrCritical": sum(1 for r in all_active if r.aiSeverity in ["HIGH", "CRITICAL"]),
    }

    serialized_items = [
        AIIssueReportItem.from_orm(r).dict() for r in reports
    ]

    return success_response(
        result={
            "stats": stats,
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
    report = db.query(AIIssueReport).filter(AIIssueReport.id == issue_id, AIIssueReport.isActive != False).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"AI Issue Report #{issue_id} not found.")

    return success_response(
        result=AIIssueReportItem.from_orm(report).dict(),
        message="AI issue detail retrieved successfully",
    )


@router.put("/{issue_id}/status")
def update_ai_issue_status(
    issue_id: int,
    req: UpdateIssueStatusRequest,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Updates the lifecycle status and admin notes for a reported AI issue (Admin only).
    """
    report = db.query(AIIssueReport).filter(AIIssueReport.id == issue_id, AIIssueReport.isActive != False).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"AI Issue Report #{issue_id} not found.")

    new_status = req.status.upper().strip()
    valid_statuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "IGNORED"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{new_status}'. Allowed values: {valid_statuses}",
        )

    report.status = new_status
    if req.adminNotes is not None:
        report.adminNotes = req.adminNotes

    if new_status == "RESOLVED":
        report.resolvedAt = datetime.utcnow()
    elif report.status != "RESOLVED":
        report.resolvedAt = None

    db.commit()
    db.refresh(report)

    logger.info(f"AI Issue #{issue_id} status updated to '{new_status}' by admin '{current_user.name}'")

    return success_response(
        result=AIIssueReportItem.from_orm(report).dict(),
        message=f"Issue report #{issue_id} status updated to {new_status}",
    )
