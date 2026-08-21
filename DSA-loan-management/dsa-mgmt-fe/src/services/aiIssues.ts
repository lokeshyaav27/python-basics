import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

export interface ReportIssuePayload {
  userQuery: string
  aiResponse: string
  issueCategory: string
  userRemarks?: string
  chatHistory?: Array<{ role: string; content: string }>
  referencedDocs?: string[]
  applicationId?: number
  customerId?: string
  agentId?: number
}

export interface ReportIssueResult {
  reportId: number
  status: string
  message: string
  severity: string
  rootCauseSummary?: string
}

export interface AIIssueReportItem {
  id: number
  userId?: number
  userName?: string
  userRole: string
  userEmail?: string
  userMobile?: string
  applicationId?: number
  customerId?: string
  agentId?: number
  userQuery: string
  aiResponse: string
  issueCategory: string
  userRemarks?: string
  chatHistory?: Array<{ role: string; content: string }>
  referencedDocs?: string[]
  aiRootCause?: string
  aiSuggestion?: string
  aiSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'IGNORED'
  adminNotes?: string
  resolvedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface AIIssuesListResult {
  stats: {
    total: number
    open: number
    underReview: number
    resolved: number
    highOrCritical: number
  }
  issues: AIIssueReportItem[]
}

export const reportAIIssue = async (payload: ReportIssuePayload): Promise<ReportIssueResult> => {
  const res = await apiClient.post<ApiResponse<ReportIssueResult>>(
    API_ENDPOINT_NAMES.AI_ISSUES.REPORT,
    payload
  )
  return res.data?.result ?? res.data
}

export const fetchAIIssues = async (params?: {
  status?: string
  severity?: string
  category?: string
  search?: string
}): Promise<AIIssuesListResult> => {
  const res = await apiClient.get<ApiResponse<AIIssuesListResult>>(
    API_ENDPOINT_NAMES.AI_ISSUES.BASE,
    { params }
  )
  return res.data?.result ?? res.data
}

export const fetchAIIssueDetail = async (id: number): Promise<AIIssueReportItem> => {
  const res = await apiClient.get<ApiResponse<AIIssueReportItem>>(
    API_ENDPOINT_NAMES.AI_ISSUES.BY_ID(id)
  )
  return res.data?.result ?? res.data
}

export const updateAIIssueStatus = async (
  id: number,
  payload: { status: string; adminNotes?: string }
): Promise<AIIssueReportItem> => {
  const res = await apiClient.put<ApiResponse<AIIssueReportItem>>(
    API_ENDPOINT_NAMES.AI_ISSUES.STATUS(id),
    payload
  )
  return res.data?.result ?? res.data
}
