import apiClient from './apiClient'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatAuthContext {
  role: string
  userId?: number
  identifier?: string
  name?: string
  email?: string
  mobile?: string
}

export interface ToolExecutionAudit {
  toolName: string
  arguments: Record<string, any>
  status: string
  summary: string
  timestamp: string
}

export interface ChatResponse {
  response: string
  toolExecutions: ToolExecutionAudit[]
  referencedDocs: string[]
  clarificationNeeded: boolean
  requiresConfirmation: boolean
}

export async function sendChatMessage(payload: {
  message: string
  history: ChatMessage[]
  authContext?: ChatAuthContext
  applicationId?: number
  customerId?: string
}): Promise<ChatResponse> {
  const res = await apiClient.post<ChatResponse>('/api/chat/assistant', payload)
  return res.data
}
