import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AuditOutlined, ArrowLeftOutlined } from '@ant-design/icons'

export default function CheckEligibility() {
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
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600 text-lg">
                <AuditOutlined />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Check Eligibility</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Instant loan eligibility assessment and qualifying criteria evaluation
              {appId ? ` for Application #${appId}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-3xl text-teal-600">
          <AuditOutlined />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-800">Check Eligibility Module</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          Eligibility calculation rules and criteria checks will be configured here.
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
