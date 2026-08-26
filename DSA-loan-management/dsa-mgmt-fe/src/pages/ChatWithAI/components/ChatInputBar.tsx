import React, { useState, useRef, useEffect } from 'react'
import { SendOutlined } from '@ant-design/icons'

export interface MentionItem {
  id: string
  type: 'app' | 'user' | 'agent'
  token: string
  title: string
  subtitle: string
  badge: string
}

interface ChatInputBarProps {
  inputVal: string
  setInputVal: (val: string) => void
  isLoading: boolean
  onSendMessage: () => void
  mentionItems: MentionItem[]
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputVal,
  setInputVal,
  isLoading,
  onSendMessage,
  mentionItems,
}) => {
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${Math.max(newHeight, 46)}px`
    }
  }, [inputVal])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputVal.trim() && !isLoading) {
        onSendMessage()
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputVal(val)

    // Check if user is typing a mention
    const lastWord = val.split(/\s+/).pop() || ''
    if (lastWord.startsWith('@')) {
      setShowMentionMenu(true)
      setMentionFilter(lastWord.slice(1).toLowerCase())
    } else {
      setShowMentionMenu(false)
    }
  }

  const handleSelectMention = (item: MentionItem) => {
    const words = inputVal.split(/\s+/)
    words.pop() // remove current '@partial'
    words.push(item.token)
    setInputVal(words.join(' ') + ' ')
    setShowMentionMenu(false)
    textareaRef.current?.focus()
  }

  const filteredMentions = mentionItems.filter(
    (m) =>
      m.title.toLowerCase().includes(mentionFilter) ||
      m.token.toLowerCase().includes(mentionFilter)
  )

  return (
    <div className="relative">
      {/* Mention Autocomplete Dropdown */}
      {showMentionMenu && filteredMentions.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl p-2 z-50 max-h-56 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mention Application, Agent, or Customer
          </div>
          {filteredMentions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectMention(item)}
              className="w-full text-left p-2 rounded-xl hover:bg-purple-50 transition flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 block">{item.title}</span>
                <span className="text-[11px] text-slate-400">{item.subtitle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    item.type === 'agent'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : item.type === 'app'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {item.badge}
                </span>
                <span className="rounded-md bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700">
                  {item.token}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Box with Auto-Resizing Textarea */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputVal}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or type @ to reference a loan... (Shift + Enter for new line)"
          className="flex-1 resize-none overflow-y-auto max-h-32 rounded-2xl border border-slate-300 px-4 py-3 text-xs sm:text-sm outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-100 transition leading-relaxed min-h-[46px]"
        />
        <button
          type="button"
          onClick={onSendMessage}
          disabled={isLoading || !inputVal.trim()}
          className="h-[46px] rounded-2xl bg-purple-600 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-700 disabled:opacity-40 transition active:scale-95 flex items-center gap-2 shrink-0"
        >
          <SendOutlined />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  )
}

export default ChatInputBar

