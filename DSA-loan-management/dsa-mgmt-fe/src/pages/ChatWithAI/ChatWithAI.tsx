import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../../services/loanApplications'
import { sendChatMessage } from '../../services/chat'
import { useAuth } from '../../auth/AuthProvider'
import { RobotOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import {
  DisplayChatMessage,
  MentionItem,
  ChatMessageBubble,
  ChatInputBar,
} from './components'

const ChatWithAI: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin'
  const [inputVal, setInputVal] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  // Build mention items from applications list
  const mentionItems: MentionItem[] = React.useMemo(() => {
    const items: MentionItem[] = []
    const seenUsers = new Set<string>()

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

    return items
  }, [applications, isAgentOrAdmin])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!inputVal.trim() || isLoading) return

    const userText = inputVal.trim()
    const userMsg: DisplayChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputVal('')
    setIsLoading(true)

    try {
      const res = await sendChatMessage(userText)
      const assistantMsg: DisplayChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecutions: res.toolExecutions,
        referencedDocs: res.referencedDocuments,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: DisplayChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content:
          '⚠️ Sorry, I encountered an error communicating with the underwriting server. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
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
            <p className="text-xs text-slate-500">
              Interactive underwriting query agent with direct access to partner bank credit policies
            </p>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-purple-700 bg-purple-50 border border-purple-200 p-3 rounded-2xl w-fit">
            <span className="animate-spin">⚙️</span>
            <span>AI Assistant is analyzing policy guidelines and credit matrix…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <ChatInputBar
        inputVal={inputVal}
        setInputVal={setInputVal}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        mentionItems={mentionItems}
      />
    </div>
  )
}

export default ChatWithAI
