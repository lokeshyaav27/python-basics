import React from 'react'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '../../../constants'

interface BankEligibilityCardProps {
  bank: any
}

export const BankEligibilityCard: React.FC<BankEligibilityCardProps> = ({ bank }) => {
  const isEligible = bank.status === 'ELIGIBLE'
  const isPartial = bank.status === 'PARTIALLY_ELIGIBLE'

  return (
    <div
      className={`rounded-3xl border p-5 transition bg-white shadow-xs space-y-4 ${
        isEligible
          ? 'border-emerald-200 ring-1 ring-emerald-500/20'
          : isPartial
          ? 'border-amber-200'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {bank.bankLogo ? (
            <img
              src={`${API_BASE_URL}/static/bank-logo-images/${bank.bankLogo}`}
              alt={bank.bankName}
              className="h-10 w-10 rounded-xl object-contain border border-slate-100 p-1"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
              🏦
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-slate-800">{bank.bankName}</h4>
            <span className="text-[11px] text-slate-400">
              Max LTV: {bank.maxLtv ? `${bank.maxLtv}%` : 'Standard'}
            </span>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
            isEligible
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isPartial
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isEligible ? 'Eligible' : isPartial ? 'Partially Eligible' : 'Ineligible'}
        </span>
      </div>

      {/* Checklist of Eligibility Criteria */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
        {bank.checklist &&
          bank.checklist.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-slate-600">
              <span>{item.criteria}</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  item.passed ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {item.passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                {item.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          ))}
      </div>

      {/* Rejection / Note remarks */}
      {bank.notes && bank.notes.length > 0 && (
        <div className="rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
          {bank.notes.map((n: string, idx: number) => (
            <div key={idx}>• {n}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BankEligibilityCard
