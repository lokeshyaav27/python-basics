import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

export interface ReportIssuePayload {
  userQuery: string
  aiResponse: string
  userRemarks?: string
  chatHistory?: Array<{ role: string; content: string }>
  referencedDocs?: string[]
}

export interface ReportIssueResult {
  reportId: number
  message: string
  rootCauseSummary?: string
}

export interface AIIssueReportItem {
  id: number
  userId?: number
  userName?: string
  userQuery: string
  aiResponse: string
  userRemarks?: string
  chatHistory?: Array<{ role: string; content: string }>
  referencedDocs?: string[]
  aiRootCause?: string
  aiSuggestion?: string
}

export interface AIIssuesListResult {
  total: number
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
