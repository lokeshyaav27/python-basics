import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { RobotOutlined, ArrowLeftOutlined } from '@ant-design/icons'

export default function ChatWithAI() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const appId = searchParams.get('appId')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
            title="Go Back"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 text-lg">
                <RobotOutlined />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Chat with AI</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              AI-driven loan assistant, policy Q&A, and documentation guidance
              {appId ? ` for Application #${appId}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600">
          <RobotOutlined />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-800">AI Loan Assistant</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          AI chat interface, policy RAG querying, and recommendations will be configured here.
        </p>
        {appId && (
          <div className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-600">
            Selected Application ID: #{appId}
          </div>
        )}
      </div>
    </div>
  )
}
