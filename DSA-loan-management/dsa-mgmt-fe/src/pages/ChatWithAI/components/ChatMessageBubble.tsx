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

  const renderFormattedContent = (text: string) => {
    if (!text) return null

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let tableLines: string[] = []
    let inTable = false

    const flushTable = (key: number) => {
      if (tableLines.length === 0) return
      const rows = tableLines
        .filter((l) => l.trim().startsWith('|') && !l.includes('---'))
        .map((l) =>
          l
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim())
        )

      if (rows.length > 0) {
        const [headerRow, ...bodyRows] = rows
        elements.push(
          <div
            key={`table-${key}`}
            className="my-3 overflow-x-auto rounded-2xl border border-purple-200/80 bg-white shadow-2xs"
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/90 border-b border-purple-100 text-purple-950 font-bold">
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="px-3.5 py-2.5">
                      {cell.replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-purple-50/30 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-700 font-medium">
                        {cell.includes('**') ? (
                          <strong className="text-slate-900 font-bold">
                            {cell.replace(/\*\*/g, '')}
                          </strong>
                        ) : cell.includes('✓') ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            {cell}
                          </span>
                        ) : cell.includes('⚠️') ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                            {cell}
                          </span>
                        ) : cell.includes('✕') ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      tableLines = []
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('|')) {
        inTable = true
        tableLines.push(trimmed)
      } else {
        if (inTable) {
          flushTable(idx)
          inTable = false
        }
        if (trimmed.startsWith('###')) {
          elements.push(
            <h5
              key={idx}
              className="text-xs font-bold uppercase tracking-wider text-purple-950 mt-3.5 mb-1"
            >
              {trimmed.replace(/^###\s*/, '')}
            </h5>
          )
        } else if (trimmed.startsWith('- **') || trimmed.startsWith('**')) {
          elements.push(
            <p key={idx} className="my-1 leading-relaxed text-slate-800">
              {trimmed.split('**').map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="font-bold text-purple-950">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          )
        } else if (trimmed.length > 0) {
          elements.push(
            <p key={idx} className="my-1 text-slate-700 leading-relaxed">
              {trimmed}
            </p>
          )
        }
      }
    })

    if (inTable) {
      flushTable(lines.length)
    }

    return <div className="space-y-1">{elements}</div>
  }

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
        <div className="text-xs sm:text-sm leading-relaxed">
          {isAssistant ? (
            renderFormattedContent(message.content)
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
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

