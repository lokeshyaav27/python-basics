import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { message as antMessage } from 'antd'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../../services/loanApplications'
import { fetchAgents, AgentItem } from '../../services/agents'
import { sendChatMessage, ChatMessage } from '../../services/chat'
import { reportAIIssue } from '../../services/aiIssues'
import { useAuth } from '../../auth/AuthProvider'
import { RobotOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import {
  DisplayChatMessage,
  MentionItem,
  ChatMessageBubble,
  ChatInputBar,
  ReportIssueModal,
} from './components'

const ChatWithAI: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'admin'
  const isAgentOrAdmin = user?.role === 'agent' || isAdmin
  const [inputVal, setInputVal] = useState('')

  const [messages, setMessages] = useState<DisplayChatMessage[]>([])
  const [reportingMessage, setReportingMessage] = useState<DisplayChatMessage | null>(null)

  // Fetch available applications for mention list
  const { data: applications = [] } = useQuery<LoanApplication[]>({
    queryKey: ['chat-applications-list', user?.role, user?.id],
    queryFn: () => {
      if (user?.role === 'customer') {
        const identifier = user.mobile || user.email || user.name || ''
        return fetchCustomerLoanApplications(identifier)
      }
      return fetchLoanApplications(user?.role === 'agent' ? user.id : undefined)
    },
  })

  // Fetch agents list for admin mentions
  const { data: agents = [] } = useQuery<AgentItem[]>({
    queryKey: ['chat-agents-list', user?.role],
    queryFn: fetchAgents,
    enabled: isAdmin,
  })

  const chatMutation = useMutation({
    mutationFn: (payload: {
      message: string
      history: ChatMessage[]
      applicationId?: number
      customerId?: string
      agentId?: number
    }) => sendChatMessage(payload),
    onSuccess: (res) => {
      const assistantMsg: DisplayChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: res.response || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedDocs: res.referencedDocs,
      }
      setMessages((prev) => [...prev, assistantMsg])
    },
    onError: () => {
      const errorMsg: DisplayChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content:
          '⚠️ Sorry, I encountered an error communicating with the underwriting server. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    },
  })

  const reportIssueMutation = useMutation({
    mutationFn: reportAIIssue,
    onSuccess: (res) => {
      antMessage.success(res.message || 'Issue report recorded successfully')
      setReportingMessage(null)
    },
    onError: (err: any) => {
      antMessage.error(err?.response?.data?.message || 'Failed to submit issue report')
    },
  })

  // Build mention items from applications and agents lists
  const mentionItems: MentionItem[] = React.useMemo(() => {
    const items: MentionItem[] = []
    const seenUsers = new Set<string>()

    // 1. Applications
    applications.forEach((app) => {
      items.push({
        id: `app-${app.id}`,
        type: 'app',
        token: `@app:${app.id}`,
        title: `App #${app.id} — ${app.name}`,
        subtitle: `${app.productName || 'Loan'} • Req: ₹${(app.loanAmountRequired || 0).toLocaleString('en-IN')}`,
        badge: 'Application',
      })

      if (isAgentOrAdmin) {
        const userKey = app.uniqueCustomerId || String(app.id)
        if (!seenUsers.has(userKey)) {
          seenUsers.add(userKey)
          items.push({
            id: `user-${userKey}`,
            type: 'user',
            token: `@user:${userKey}`,
            title: `Customer: ${app.name || 'User'}`,
            subtitle: `${app.mobile || app.email} • ID: ${userKey}`,
            badge: 'Customer',
          })
        }
      }
    })

    // 2. Agents (for Admin only)
    if (isAdmin && agents.length > 0) {
      agents.forEach((ag) => {
        items.push({
          id: `agent-${ag.id}`,
          type: 'agent',
          token: `@agent:${ag.id}`,
          title: `Agent: ${ag.name}`,
          subtitle: `${ag.email} • Mobile: ${ag.mobile}${ag.isAdmin ? ' (Admin)' : ''}`,
          badge: ag.isAdmin ? 'Admin' : 'Agent',
        })
      })
    }

    return items
  }, [applications, agents, isAdmin, isAgentOrAdmin])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, chatMutation.isPending])

  const handleSendMessage = () => {
    if (!inputVal.trim() || chatMutation.isPending) return

    const userText = inputVal.trim()
    const userMsg: DisplayChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Build history (last 8 messages)
    const recentHistory: ChatMessage[] = messages
      .filter((m) => !m.id.startsWith('error-'))
      .slice(-8)
      .map((m) => ({
        role: m.sender === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

    // Detect @app:123, @user:xyz, or @agent:123 tags in userText
    let linkedAppId: number | undefined
    let linkedCustId: string | undefined
    let linkedAgentId: number | undefined

    const appMatch = userText.match(/@app:(\d+)/i)
    if (appMatch) {
      linkedAppId = parseInt(appMatch[1], 10)
    }

    const userMatch = userText.match(/@user:([a-zA-Z0-9_-]+)/i)
    if (userMatch) {
      linkedCustId = userMatch[1]
    }

    const agentMatch = userText.match(/@agent:(\d+)/i)
    if (agentMatch) {
      linkedAgentId = parseInt(agentMatch[1], 10)
    }

    setMessages((prev) => [...prev, userMsg])
    setInputVal('')
    chatMutation.mutate({
      message: userText,
      history: recentHistory,
      applicationId: linkedAppId,
      customerId: linkedCustId,
      agentId: linkedAgentId,
    })
  }

  // Find the preceding user prompt for the reported assistant message
  const getPrecedingUserPrompt = (assistantMsg: DisplayChatMessage | null): string => {
    if (!assistantMsg) return ''
    const idx = messages.findIndex((m) => m.id === assistantMsg.id)
    if (idx > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].sender === 'user') {
          return messages[i].content
        }
      }
    }
    return ''
  }

  const handleReportSubmit = async (payload: {
    issueCategory: string
    userRemarks: string
    reportedAssistantMsg: DisplayChatMessage
  }) => {
    const userPromptText = getPrecedingUserPrompt(payload.reportedAssistantMsg)
    const historyPayload = messages.map((m) => ({
      role: m.sender,
      content: m.content,
    }))

    // Extract any @app: or @user: or @agent: mentions in prompt
    let linkedAppId: number | undefined
    let linkedCustId: string | undefined
    let linkedAgentId: number | undefined

    const appMatch = userPromptText.match(/@app:(\d+)/i)
    if (appMatch) linkedAppId = parseInt(appMatch[1], 10)

    const userMatch = userPromptText.match(/@user:([a-zA-Z0-9_-]+)/i)
    if (userMatch) linkedCustId = userMatch[1]

    const agentMatch = userPromptText.match(/@agent:(\d+)/i)
    if (agentMatch) linkedAgentId = parseInt(agentMatch[1], 10)

    await reportIssueMutation.mutateAsync({
      userQuery: userPromptText || 'User prompt from conversation',
      aiResponse: payload.reportedAssistantMsg.content,
      issueCategory: payload.issueCategory,
      userRemarks: payload.userRemarks,
      chatHistory: historyPayload,
      referencedDocs: payload.reportedAssistantMsg.referencedDocs || [],
      applicationId: linkedAppId,
      customerId: linkedCustId,
      agentId: linkedAgentId,
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-2xs transition"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <RobotOutlined className="text-purple-600" /> AI Underwriting Assistant
            </h1>
            <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
              Hello {user?.name || 'User'}! 👋 I am your <span className="text-purple-700 font-extrabold">AI Loan Underwriting Assistant</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 text-purple-700 text-3xl shadow-xs">
              <RobotOutlined />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-slate-800">Ready to Assist</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask any questions regarding loan eligibility, interest rate matrices, agent portfolios, or partner bank policy documents.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            onReportIssue={(target) => setReportingMessage(target)}
          />
        ))}
        {chatMutation.isPending && (
          <div className="flex items-center gap-3 text-xs text-purple-700 bg-purple-50 border border-purple-200 p-3 rounded-2xl w-fit">
            <span className="animate-spin">⚙️</span>
            <span>AI Assistant is analyzing policy guidelines and credit matrix…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Helper Info & Input Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-purple-50/90 border border-purple-200/80 text-[11px] sm:text-xs text-purple-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">💡</span>
            <span>
              <strong className="font-bold text-purple-950">Quick Reference:</strong> Type{' '}
              <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-purple-200 font-mono text-[11px] font-bold text-purple-700 shadow-3xs">
                @
              </kbd>{' '}
              to directly tag & evaluate applications{' '}
              <span className="font-mono text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-800 font-bold border border-purple-200/60">
                @app:18
              </span>
              {isAdmin && (
                <>
                  {', '}agents{' '}
                  <span className="font-mono text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-bold border border-blue-200/60">
                    @agent:2
                  </span>
                </>
              )}
              {isAgentOrAdmin && (
                <>
                  {', '}or customer dossiers{' '}
                  <span className="font-mono text-[10px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-bold border border-amber-200/60">
                    @user:123123
                  </span>
                </>
              )}
            </span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
            Policy RAG Active ✓
          </span>
        </div>

        <ChatInputBar
          inputVal={inputVal}
          setInputVal={setInputVal}
          isLoading={chatMutation.isPending}
          onSendMessage={handleSendMessage}
          mentionItems={mentionItems}
        />
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        open={!!reportingMessage}
        onClose={() => setReportingMessage(null)}
        targetMessage={reportingMessage}
        userPromptText={getPrecedingUserPrompt(reportingMessage)}
        onSubmitReport={handleReportSubmit}
        isSubmitting={reportIssueMutation.isPending}
      />
    </div>
  )
}

export default ChatWithAI
