import React from 'react'
import { LoanApplication } from '../../../services/loanApplications'

interface ApplicantContactInfoProps {
  application: LoanApplication
  isEditing: boolean
  name: string
  email: string
  mobile: string
  setName: (v: string) => void
  setEmail: (v: string) => void
  setMobile: (v: string) => void
}

export const ApplicantContactInfo: React.FC<ApplicantContactInfoProps> = ({
  application,
  isEditing,
  name,
  email,
  mobile,
  setName,
  setEmail,
  setMobile,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
        <span>👤</span> Applicant Contact Information
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Applicant Name</label>
          {isEditing ? (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          ) : (
            <span className="text-sm font-bold text-slate-800">{name}</span>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Email Address</label>
          {isEditing ? (
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          ) : (
            <span className="text-sm font-medium text-slate-700">{email}</span>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mobile Number</label>
          {isEditing ? (
            <input
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          ) : (
            <span className="text-sm font-medium text-slate-700">{mobile}</span>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unique Customer ID</label>
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg block w-fit mt-1">
            {application.uniqueCustomerId || application.mobile}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ApplicantContactInfo
