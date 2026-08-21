import React from 'react'
import { RobotOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons'

export interface DisplayChatMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  referencedDocs?: string[]
}

interface ChatMessageBubbleProps {
  message: DisplayChatMessage
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isAssistant = message.sender === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-600 text-white shrink-0 shadow-sm mt-1">
          <RobotOutlined className="text-base" />
        </div>
      )}

      <div
        className={`max-w-2xl rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 ${
          isAssistant
            ? 'bg-white border border-slate-200 text-slate-800'
            : 'bg-blue-600 text-white'
        }`}
      >
        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Referenced Policy Documents */}
        {message.referencedDocs && message.referencedDocs.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <FileTextOutlined /> References:
            </span>
            {message.referencedDocs.map((doc, idx) => (
              <span
                key={idx}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700"
              >
                {doc}
              </span>
            ))}
          </div>
        )}

        <div
          className={`text-[10px] text-right ${
            isAssistant ? 'text-slate-400' : 'text-blue-200'
          }`}
        >
          {message.timestamp}
        </div>
      </div>

      {!isAssistant && (
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-700 text-white shrink-0 shadow-sm mt-1">
          <UserOutlined className="text-base" />
        </div>
      )}
    </div>
  )
}

export default ChatMessageBubble
