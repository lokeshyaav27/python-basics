import React from 'react'
import { PersonalLoanDetailsData } from '../../../services/loanApplications'
import { formatCurrency } from './StatusBadges'

interface PersonalLoanDetailsTabProps {
  personalDetails: PersonalLoanDetailsData
  setPersonalDetails: React.Dispatch<React.SetStateAction<PersonalLoanDetailsData>>
  isEditing: boolean
}

export const PersonalLoanDetailsTab: React.FC<PersonalLoanDetailsTabProps> = ({
  personalDetails,
  setPersonalDetails,
  isEditing,
}) => {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
          <span>💼</span> Personal Loan Details (All Captured Fields)
        </h4>
        <span className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded">
          Unsecured Credit
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* 1. Loan Purpose */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">1. Loan Purpose</label>
          {isEditing ? (
            <select
              value={personalDetails.loan_purpose ?? 'Home Improvement'}
              onChange={(e) =>
                setPersonalDetails({ ...personalDetails, loan_purpose: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="Home Improvement">Home Renovation</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Wedding / Family Event">Wedding / Family Event</option>
              <option value="Higher Education">Higher Education</option>
              <option value="Debt Consolidation">Debt Consolidation</option>
              <option value="Travel / Vacation">Travel / Vacation</option>
              <option value="Business Expansion">Business Expansion</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{personalDetails.loan_purpose || '—'}</span>
          )}
        </div>

        {/* 2. Other Details / Remarks */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">2. Purpose Description / Remarks</label>
          {isEditing ? (
            <input
              value={personalDetails.other ?? ''}
              onChange={(e) =>
                setPersonalDetails({ ...personalDetails, other: e.target.value })
              }
              placeholder="Additional remarks"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">{personalDetails.other || '—'}</span>
          )}
        </div>

        {/* 3. Required Amount */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">3. Required Amount</label>
          {isEditing ? (
            <input
              type="number"
              value={personalDetails.required_amount ?? ''}
              onChange={(e) =>
                setPersonalDetails({
                  ...personalDetails,
                  required_amount: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-extrabold text-emerald-700">
              {formatCurrency(personalDetails.required_amount)}
            </span>
          )}
        </div>

        {/* 4. Existing Obligations */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">4. Existing Obligations / EMIs</label>
          {isEditing ? (
            <input
              type="number"
              value={personalDetails.existing_obligations ?? ''}
              onChange={(e) =>
                setPersonalDetails({
                  ...personalDetails,
                  existing_obligations: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">
              {formatCurrency(personalDetails.existing_obligations)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonalLoanDetailsTab
