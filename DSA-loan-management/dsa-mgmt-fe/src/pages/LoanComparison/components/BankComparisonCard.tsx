import React from 'react'
import { BankComparisonItem } from '../../../services/comparison'
import { API_BASE_URL } from '../../../constants'

interface BankComparisonCardProps {
  bank: BankComparisonItem
  isUserAgentOrAdmin: boolean
}

export const BankComparisonCard: React.FC<BankComparisonCardProps> = ({
  bank,
  isUserAgentOrAdmin,
}) => {
  const isEligible = bank.status === 'ELIGIBLE'
  const isPartial = bank.status === 'PARTIALLY_ELIGIBLE'

  return (
    <div
      className={`rounded-3xl border p-6 transition duration-200 flex flex-col justify-between ${
        isEligible
          ? 'border-emerald-200 bg-white shadow-lg shadow-emerald-900/5 ring-2 ring-emerald-500/20'
          : isPartial
          ? 'border-amber-200 bg-white shadow-md'
          : 'border-slate-200 bg-slate-50/70 shadow-xs'
      }`}
    >
      <div className="space-y-5">
        {/* Header with Bank Logo & Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {bank.bankLogo ? (
              <img
                src={`${API_BASE_URL}/static/bank-logo-images/${bank.bankLogo}`}
                alt={bank.bankName}
                className="h-12 w-12 rounded-2xl object-contain border border-slate-200 bg-white p-1.5"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl">
                🏦
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{bank.bankName}</h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {bank.isNationalize ? 'Nationalized Bank' : bank.isPrivate ? 'Private Bank' : 'NBFC'}
              </span>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold border ${
              isEligible
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isPartial
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isEligible ? 'Eligible' : isPartial ? 'Partially Eligible' : 'Not Eligible'}
          </span>
        </div>

        {/* Pricing Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="rounded-2xl bg-slate-50 p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated ROI</span>
            <span className="text-base font-extrabold text-blue-700">
              {bank.roi ? `${bank.roi.toFixed(2)}% p.a.` : '—'}
            </span>
            {bank.femaleRebateApplied && (
              <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                ✓ 0.05% Female Rebate
              </span>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Monthly EMI</span>
            <span className="text-base font-extrabold text-emerald-600">
              {bank.emi ? `₹ ${bank.emi.toLocaleString('en-IN')}` : '—'}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligible Loan Amount</span>
            <span className="text-sm font-bold text-slate-800">
              {bank.loanAmount ? `₹ ${bank.loanAmount.toLocaleString('en-IN')}` : '—'}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Tenure</span>
            <span className="text-sm font-bold text-slate-800">{bank.tenure || '—'}</span>
          </div>
        </div>

        {/* Insurance and Commission Section */}
        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
          <div className="flex justify-between text-slate-600">
            <span>Processing Fee:</span>
            <span className="font-semibold text-slate-800">{bank.processingFee || '0.50% - 1.00%'}</span>
          </div>

          {isUserAgentOrAdmin && bank.commissionAmount != null && (
            <div className="flex justify-between text-blue-700 font-semibold bg-blue-50/60 p-2 rounded-xl border border-blue-100">
              <span>DSA Payout Commission:</span>
              <span>{bank.commissionPct}% (₹ {bank.commissionAmount.toLocaleString('en-IN')})</span>
            </div>
          )}

          {bank.reasonForRejection && bank.reasonForRejection.length > 0 && (
            <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-rose-800 space-y-1">
              <span className="text-[11px] font-bold block">Eligibility Conditions / Remarks:</span>
              <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                {bank.reasonForRejection.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BankComparisonCard
