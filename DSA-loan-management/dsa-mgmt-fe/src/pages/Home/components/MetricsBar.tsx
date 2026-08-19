import React from 'react'

export const MetricsBar: React.FC = () => {
  return (
    <section className="-mt-10 relative z-10 mx-auto max-w-6xl px-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-3xl bg-white p-6 shadow-xl border border-slate-200/80">
        <div className="text-center p-2">
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">₹500 Cr+</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Loans Disbursed</div>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">25+</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Partner Banks & NBFCs</div>
        </div>
        <div className="text-center p-2 sm:border-l border-slate-100">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">99.4%</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Customer Approval Rate</div>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">4.9 ★</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Over 15,000+ Reviews</div>
        </div>
      </div>
    </section>
  )
}

export default MetricsBar
