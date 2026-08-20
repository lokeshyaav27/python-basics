import React from 'react'
import { LoanApplication } from '../../../services/loanApplications'

interface ApplicantContactInfoProps {
  application: LoanApplication
  name: string
  email: string
  mobile: string
}

export const ApplicantContactInfo: React.FC<ApplicantContactInfoProps> = ({
  application,
  name,
  email,
  mobile,
}) => {
  const displayName = name || application.name || '—'
  const displayEmail = email || application.email || '—'
  const displayMobile = mobile || application.mobile || '—'

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-2xs">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
        <span>👤</span> Applicant Contact Information
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Applicant Name</label>
          <span className="text-sm font-bold text-slate-800">{displayName}</span>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Email Address</label>
          <span className="text-sm font-medium text-slate-700">{displayEmail}</span>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">Mobile Number</label>
          <span className="text-sm font-medium text-slate-700">{displayMobile}</span>
        </div>
      </div>
    </div>
  )
}

export default ApplicantContactInfo
