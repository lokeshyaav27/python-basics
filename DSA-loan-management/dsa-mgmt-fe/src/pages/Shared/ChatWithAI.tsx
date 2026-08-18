import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../../services/loanApplications'
import { sendChatMessage, ToolExecutionAudit } from '../../services/chat'
import { useAuth } from '../../auth/AuthProvider'
import {
  RobotOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  UserOutlined,
  FileTextOutlined,
  LoadingOutlined,
  ToolOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { Tooltip, message as antdMessage } from 'antd'

interface MentionItem {
  id: string
  type: 'app' | 'user'
  token: string
  title: string
  subtitle: string
  badge: string
}

interface DisplayChatMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  toolExecutions?: ToolExecutionAudit[]
  referencedDocs?: string[]
}

export default function ChatWithAI() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin'
  const [inputVal, setInputVal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})

  const [messages, setMessages] = useState<DisplayChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content:
        `Hello ${user?.name || ''}! 👋 I am your **AI Loan Underwriting Assistant**.\n\n` +
        `Ask any questions about loan underwriting, bank policies, or interest rate matrices.\n` +
        (isAgentOrAdmin
          ? `You can also tag specific applications or customers directly by typing **\`@\`** (e.g. \`@app:18\` or \`@user:123123\`).`
          : `You can also reference your loan application directly by typing **\`@\`** (e.g. \`@app:18\`).`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

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

  // Build mention items from applications list (Customer gets ONLY their applications, no @user tagging)
  const mentionItems: MentionItem[] = React.useMemo(() => {
    const items: MentionItem[] = []
    const seenUsers = new Set<string>()

    applications.forEach((app) => {
      // Application Mention Item (Available to both agent and customer)
      items.push({
        id: `app-${app.id}`,
        type: 'app',
        token: `@app:${app.id}`,
        title: `App #${app.id} — ${app.name}`,
        subtitle: `${app.productName || 'Loan'} • Req: ₹${(app.loanAmountRequired || 0).toLocaleString('en-IN')}`,
        badge: 'Application',
      })

      // Customer Mention Item (Available ONLY to agents/admins)
      if (isAgentOrAdmin) {
        const userKey = app.uniqueCustomerId || String(app.id)
        if (!seenUsers.has(userKey)) {
          seenUsers.add(userKey)
          items.push({
            id: `user-${userKey}`,
            type: 'user',
            token: `@user:${userKey}`,
            title: `Customer: ${app.name}`,
            subtitle: `Customer ID: ${app.uniqueCustomerId || 'N/A'} • ${app.mobile || app.email || ''}`,
            badge: 'Customer',
          })
        }
      }
    })

    return items
  }, [applications, isAgentOrAdmin])

  // Mention State
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Filtered mentions based on search query
  const filteredMentions = mentionItems.filter((item) => {
    if (!mentionQuery) return true
    const q = mentionQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.token.toLowerCase().includes(q)
    )
  })

  // Handle textarea text change and detect '@'
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputVal(val)

    const cursorPos = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursorPos)
    const match = textBeforeCursor.match(/@([\w:-]*)$/)

    if (match) {
      setMentionQuery(match[1])
      setMentionOpen(true)
      setSelectedMentionIndex(0)
    } else {
      setMentionOpen(false)
    }
  }

  // Insert selected mention token into textarea
  const handleInsertMention = (item: MentionItem) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart || 0
    const textBeforeCursor = inputVal.slice(0, cursorPos)
    const textAfterCursor = inputVal.slice(cursorPos)

    const newTextBefore = textBeforeCursor.replace(/@([\w:-]*)$/, item.token + ' ')
    const updatedVal = newTextBefore + textAfterCursor

    setInputVal(updatedVal)
    setMentionOpen(false)

    setTimeout(() => {
      textarea.focus()
      const newPos = newTextBefore.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  // Keyboard navigation for mentions & submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMentions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        handleInsertMention(filteredMentions[selectedMentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionOpen(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }))
  }

  const handleSendMessage = async () => {
    const trimmed = inputVal.trim()
    if (!trimmed || isLoading) return

    // Extract @app:ID or @user:ID from query if present
    const appMatch = trimmed.match(/@app:(\d+)/)
    const userMatch = trimmed.match(/@user:([\w:-]+)/)
    const linkedAppId = appMatch ? parseInt(appMatch[1], 10) : undefined
    const linkedCustId = userMatch ? userMatch[1] : undefined

    const userMsg: DisplayChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputVal('')
    setMentionOpen(false)
    setIsLoading(true)

    // Convert display messages to API history
    const historyPayload = messages.map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }))

    try {
      const res = await sendChatMessage({
        message: trimmed,
        history: historyPayload,
        authContext: {
          role: user?.role || 'customer',
          userId: user?.id,
          identifier: user?.mobile || user?.email || user?.uniqueCustomerId,
          name: user?.name,
          email: user?.email,
          mobile: user?.mobile,
        },
        applicationId: linkedAppId,
        customerId: linkedCustId,
      })

      const assistantMsg: DisplayChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecutions: res.toolExecutions,
        referencedDocs: res.referencedDocs,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      antdMessage.error(err.message || 'Failed to get response from AI Assistant')
      const errorMsg: DisplayChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        content: `⚠️ **Error communicating with AI Assistant**:\n${err.message || 'An unexpected error occurred.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Render message content with styled mention chips
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@app:\w+|@user:\w+)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('@app:')) {
        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-md bg-purple-100/90 text-purple-900 px-1.5 py-0.5 text-xs font-bold border border-purple-200"
          >
            <FileTextOutlined className="text-[10px]" /> {part}
          </span>
        )
      }
      if (part.startsWith('@user:')) {
        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded-md bg-blue-100/90 text-blue-900 px-1.5 py-0.5 text-xs font-bold border border-blue-200"
          >
            <UserOutlined className="text-[10px]" /> {part}
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      {/* ── Minimalist ChatGPT-style Header ───────────────────────────── */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200/70 shrink-0 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-2xs hover:scale-105 active:scale-95"
            title="Go Back"
          >
            <ArrowLeftOutlined />
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white text-xs shadow-xs">
              <RobotOutlined />
            </span>
            <span className="text-sm font-bold text-slate-800">DSA Loan Underwriter</span>
            <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-mono font-semibold border border-blue-200/60">
              GPT-OSS 120B • MCP & RAG
            </span>
          </div>
        </div>
      </div>

      {/* ── Chat Messages Canvas ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white text-sm shrink-0 shadow-xs mt-0.5">
                <RobotOutlined />
              </div>
            )}

            <div
              className={`max-w-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-3xl rounded-tr-sm px-5 py-3.5 shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-3xl rounded-tl-sm px-5 py-4 shadow-2xs whitespace-pre-line'
              }`}
            >
              {/* Tool Execution Badges Accordion */}
              {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                <div className="mb-3 rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleToolExpand(msg.id)}
                    className="flex w-full items-center justify-between font-semibold text-slate-700 hover:text-blue-600 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <ToolOutlined className="text-blue-600" />
                      Executed {msg.toolExecutions.length} MCP / RAG Tool{msg.toolExecutions.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {expandedTools[msg.id] ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  </button>

                  {expandedTools[msg.id] && (
                    <div className="mt-2 space-y-1.5 border-t border-slate-200 pt-2 text-[11px]">
                      {msg.toolExecutions.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                          {t.status === 'SUCCESS' ? (
                            <CheckCircleOutlined className="text-emerald-500 mt-0.5" />
                          ) : (
                            <CloseCircleOutlined className="text-rose-500 mt-0.5" />
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-800">{t.toolName}</span>: {t.summary}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Referenced Policy Documents */}
              {msg.referencedDocs && msg.referencedDocs.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5 items-center text-[11px] text-slate-500">
                  <span className="font-semibold flex items-center gap-1 text-slate-600">
                    <FileSearchOutlined className="text-purple-600" /> Sources:
                  </span>
                  {msg.referencedDocs.map((doc, idx) => (
                    <span key={idx} className="rounded-md bg-purple-50 px-2 py-0.5 font-medium text-purple-700 border border-purple-200/60">
                      {doc}
                    </span>
                  ))}
                </div>
              )}

              <div>{renderMessageContent(msg.content)}</div>
              <div
                className={`mt-2 text-[10px] ${
                  msg.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white text-xs shrink-0 shadow-xs mt-0.5">
                <UserOutlined />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start items-center">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white text-sm shrink-0 shadow-xs">
              <RobotOutlined />
            </div>
            <div className="rounded-3xl rounded-tl-sm bg-white border border-slate-200/80 px-5 py-3 shadow-2xs flex items-center gap-2 text-xs text-slate-500">
              <LoadingOutlined className="text-blue-600 text-sm" />
              <span>Analyzing loan context, calculating underwriting metrics & searching policies...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* ── ChatGPT-Style Bottom Input Capsule ─────────────────────────── */}
      <div className="shrink-0 pt-2 pb-3 relative">
        {/* Autocomplete Mention Popup */}
        {mentionOpen && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-3 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 space-y-1">
            <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <span>{isAgentOrAdmin ? 'Tag Application or Customer ID' : 'Tag Your Loan Application'}</span>
              <span className="text-purple-600">{filteredMentions.length} matches</span>
            </div>
            {filteredMentions.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleInsertMention(item)}
                onMouseEnter={() => setSelectedMentionIndex(idx)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition ${
                  selectedMentionIndex === idx
                    ? 'bg-purple-50 text-purple-900 border border-purple-200/80'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      item.type === 'app'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.type === 'app' ? <FileTextOutlined /> : <UserOutlined />}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-purple-600 bg-purple-100/70 rounded px-2 py-0.5 font-bold">
                  {item.token}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Input Capsule Box */}
        <div className="rounded-3xl border border-slate-300 bg-white p-2.5 shadow-sm focus-within:border-slate-400 focus-within:shadow-md transition">
          <div className="flex items-end gap-2">
            {/* Mention Trigger Icon */}
            <Tooltip title={isAgentOrAdmin ? 'Mention Application or Customer (@)' : 'Mention Loan Application (@)'}>
              <button
                type="button"
                onClick={() => {
                  setInputVal((prev) => prev + (prev && !prev.endsWith(' ') ? ' @' : '@'))
                  setMentionOpen(true)
                  setMentionQuery('')
                  textareaRef.current?.focus()
                }}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition shrink-0"
              >
                @
              </button>
            </Tooltip>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isAgentOrAdmin
                  ? 'Ask anything, or type @ to reference a loan application or customer...'
                  : 'Ask anything, or type @ to reference your loan application...'
              }
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-800 outline-none max-h-32 min-h-[38px] leading-relaxed placeholder:text-slate-400"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!inputVal.trim() || isLoading}
              className={`h-9 w-9 inline-flex items-center justify-center rounded-full transition active:scale-95 shrink-0 ${
                inputVal.trim() && !isLoading
                  ? 'bg-slate-900 text-white shadow-xs hover:bg-black'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Send message"
            >
              {isLoading ? <LoadingOutlined className="text-xs" /> : <SendOutlined className="text-xs" />}
            </button>
          </div>
        </div>

        {/* Subtitle / Disclaimer */}
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          AI Underwriter evaluates policies, FOIR, and EMIs via deterministic MCP tools & RAG. Verify figures with bank sanction letters.
        </p>
      </div>
    </div>
  )
}
