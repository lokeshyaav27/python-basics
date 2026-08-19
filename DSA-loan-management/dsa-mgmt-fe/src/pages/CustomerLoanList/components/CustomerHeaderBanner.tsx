import React from 'react'
import { Link } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import { ROUTES } from '../../../constants'

interface CustomerHeaderBannerProps {
  customerIdentifier: string
  totalCount: number
  inReviewCount: number
  approvedCount: number
  rejectedCount: number
}

export const CustomerHeaderBanner: React.FC<CustomerHeaderBannerProps> = ({
  customerIdentifier,
  totalCount,
  inReviewCount,
  approvedCount,
  rejectedCount,
}) => {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200 border border-blue-400/20 mb-3">
            <span>📱</span> Mobile: {customerIdentifier || 'Registered Customer'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            My Loan Applications
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
            Track real-time progress, bank recommendations, and approval updates for all your submitted loan applications.
          </p>
        </div>

        <Link
          to={ROUTES.APPLY_FOR_LOAN}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
        >
          <PlusOutlined /> Apply for New Loan
        </Link>
      </div>

      {/* Quick Stat Counters */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-6">
        <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
          <span className="text-[11px] text-slate-400 block font-medium">Total Applications</span>
          <span className="text-xl font-extrabold text-white mt-0.5 block">{totalCount}</span>
        </div>

        <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
          <span className="text-[11px] text-amber-300 block font-medium">Under Review</span>
          <span className="text-xl font-extrabold text-amber-400 mt-0.5 block">{inReviewCount}</span>
        </div>

        <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
          <span className="text-[11px] text-emerald-300 block font-medium">Approved / Forwarded</span>
          <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">{approvedCount}</span>
        </div>

        <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-xs border border-white/5">
          <span className="text-[11px] text-rose-300 block font-medium">Rejected</span>
          <span className="text-xl font-extrabold text-rose-400 mt-0.5 block">{rejectedCount}</span>
        </div>
      </div>
    </div>
  )
}

export default CustomerHeaderBanner
