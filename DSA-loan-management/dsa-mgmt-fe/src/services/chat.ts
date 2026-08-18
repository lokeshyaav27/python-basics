const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

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
  const res = await fetch(`${API_BASE_URL}/api/chat/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': payload.authContext?.role || 'customer',
      'X-User-Id': String(payload.authContext?.userId || ''),
      'X-Customer-Id': payload.authContext?.identifier || '',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to communicate with AI Assistant' }))
    throw new Error(err.detail || `Server returned ${res.status}`)
  }

  return res.json()
}
