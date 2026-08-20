import React from 'react'
import { EditOutlined, BarChartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { EligibilityResult } from '../../../services/eligibility'
import { ROUTES } from '../../../constants'

interface ApplicantSummaryCardProps {
  eligibility: EligibilityResult
  onOpenEdit: () => void
}

export const ApplicantSummaryCard: React.FC<ApplicantSummaryCardProps> = ({
  eligibility,
  onOpenEdit,
}) => {
  const navigate = useNavigate()
  const data = eligibility.applicantData || {}

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Dossier #{eligibility.applicationId} • {eligibility.productName || 'Loan'}
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {eligibility.customerName || 'Applicant Profile'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <EditOutlined /> Edit Parameters
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(`${ROUTES.SHARED.LOAN_COMPARISON}?applicationId=${eligibility.applicationId}`)
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <BarChartOutlined /> Compare Rates
          </button>
        </div>
      </div>

      {/* Grid of Profile Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="rounded-2xl bg-slate-50 p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Age / Gender</span>
          <span className="font-bold text-slate-800">
            {data.age ? `${data.age} Yrs` : '—'} • {data.gender || '—'}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Employment</span>
          <span className="font-bold text-slate-800">{data.employmentType || '—'}</span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Monthly Income</span>
          <span className="font-bold text-emerald-600">
            {data.monthlyIncome ? `₹${data.monthlyIncome.toLocaleString('en-IN')}` : '—'}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">CIBIL Score</span>
          <span className="font-bold text-blue-700">{data.cibilScore || '—'}</span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Loan Required</span>
          <span className="font-bold text-slate-800">
            {data.loanAmountRequired
              ? `₹${data.loanAmountRequired.toLocaleString('en-IN')}`
              : '—'}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenure</span>
          <span className="font-bold text-slate-800">
            {data.preferredTenure ? `${data.preferredTenure} Months` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ApplicantSummaryCard
