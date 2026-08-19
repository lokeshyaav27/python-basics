import React from 'react'

export const StatusBadge: React.FC<{ status?: string | null; bankName?: string | null }> = ({
  status,
  bankName,
}) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
        <span>⏳</span> Pending Review
      </span>
    )
  }

  const s = status.toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
        <span>✅</span> Approved {bankName ? `(${bankName})` : ''}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
        <span>❌</span> Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
      <span>⏳</span> Pending Review
    </span>
  )
}

export const CibilBadge: React.FC<{ score?: number | null }> = ({ score }) => {
  if (!score) return <span className="text-slate-400 font-medium">Not provided</span>
  if (score >= 750) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
        <span>🟢</span> {score} (Excellent)
      </span>
    )
  }
  if (score >= 680) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700 border border-blue-200">
        <span>🔵</span> {score} (Good)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700 border border-amber-200">
      <span>🟡</span> {score} (Fair / Average)
    </span>
  )
}

export const formatCurrency = (val?: number | string | null): string => {
  if (val === null || val === undefined || val === '') return '—'
  const num = Number(val)
  if (isNaN(num)) return '—'
  return `₹ ${num.toLocaleString('en-IN')}`
}
