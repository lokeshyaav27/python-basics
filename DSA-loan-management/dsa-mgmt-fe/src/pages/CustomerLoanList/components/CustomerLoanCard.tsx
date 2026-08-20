import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from 'antd'
import { EyeOutlined, AuditOutlined, BarChartOutlined } from '@ant-design/icons'
import { LoanApplication } from '../../../services/loanApplications'
import { API_BASE_URL, ROUTES } from '../../../constants'

export const StatusBadge: React.FC<{ status?: string | null; bankName?: string | null }> = ({
  status,
  bankName,
}) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
        <span>⏳</span> Under Review
      </span>
    )
  }

  const s = status.toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
        <span>✅</span> Approved {bankName ? `(${bankName})` : ''}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-2xs">
        <span>❌</span> Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
      <span>⏳</span> Under Review
    </span>
  )
}

interface CustomerLoanCardProps {
  loan: LoanApplication
  onOpenDetails: (loan: LoanApplication) => void
}

export const CustomerLoanCard: React.FC<CustomerLoanCardProps> = ({ loan, onOpenDetails }) => {
  const reqAmount =
    loan.loanAmountRequired ||
    loan.clientGeneralDetails?.loan_amount_required ||
    loan.personalLoanDetails?.required_amount ||
    loan.homeLoanDetails?.property_value ||
    loan.carLoanDetails?.car_value ||
    null

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {loan.productImage ? (
              <img
                src={`${API_BASE_URL}/static/product-images/${loan.productImage}`}
                alt={loan.productName}
                className="h-12 w-12 rounded-2xl object-cover border border-slate-100 p-1 bg-white"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-xl font-bold">
                💳
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {loan.productName || 'Loan Application'}
              </h3>
              <span className="text-xs text-slate-400 font-mono">App ID: #{loan.id}</span>
            </div>
          </div>
          <StatusBadge status={loan.status} bankName={loan.bankName} />
        </div>

        {/* Application Key Financial Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested Amount</span>
            <span className="text-sm font-extrabold text-blue-700">
              {reqAmount ? `₹ ${reqAmount.toLocaleString('en-IN')}` : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenure</span>
            <span className="text-sm font-bold text-slate-700">
              {loan.preferredTenure || loan.clientGeneralDetails?.preferred_tenure
                ? `${loan.preferredTenure || loan.clientGeneralDetails?.preferred_tenure} M`
                : '—'}
            </span>
          </div>
        </div>

        {/* Assigned Agent Contact Pill */}
        {loan.agentName && (
          <div className="mt-3 rounded-xl bg-blue-50/60 p-2.5 border border-blue-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-blue-600 block font-semibold">Assigned DSA Advisor</span>
              <span className="font-bold text-slate-800">{loan.agentName}</span>
            </div>
            {loan.agentMobile && (
              <a
                href={`tel:${loan.agentMobile}`}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                📞 {loan.agentMobile}
              </a>
            )}
          </div>
        )}

        {/* Status description remarks */}
        {loan.description && (
          <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700 block mb-0.5">Status Update:</span>
            {loan.description}
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenDetails(loan)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <EyeOutlined /> View Dossier
        </button>

        <div className="flex items-center gap-1.5">
          <Tooltip title="View Eligibility Matrix">
            <Link
              to={`${ROUTES.CUSTOMER.CHECK_ELIGIBILITY}?applicationId=${loan.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 h-8 w-8 text-xs hover:bg-blue-100 transition shadow-2xs"
            >
              <AuditOutlined />
            </Link>
          </Tooltip>
          <Tooltip title="Compare Bank Offers">
            <Link
              to={`${ROUTES.CUSTOMER.LOAN_COMPARISON}?applicationId=${loan.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 h-8 w-8 text-xs hover:bg-indigo-100 transition shadow-2xs"
            >
              <BarChartOutlined />
            </Link>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default CustomerLoanCard
