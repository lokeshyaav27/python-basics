import React from 'react'
import { CurrencyInput } from '../../../components/CurrencyInput'

interface PersonalLoanStepSectionProps {
  personalLoanDetails: any
  setPersonalLoanDetails: React.Dispatch<React.SetStateAction<any>>
}

export const PersonalLoanStepSection: React.FC<PersonalLoanStepSectionProps> = ({
  personalLoanDetails,
  setPersonalLoanDetails,
}) => {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">💼</span>
        <h3 className="text-sm font-bold text-emerald-900">Personal Loan / Credit Purpose</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-xs">
        <CurrencyInput
          required
          label="Loan Amount Required (₹)"
          placeholder="e.g. 5,00,000"
          value={personalLoanDetails.loan_amount_required ?? personalLoanDetails.required_amount}
          onChange={(val) =>
            setPersonalLoanDetails({
              ...personalLoanDetails,
              loan_amount_required: val,
              required_amount: val,
            })
          }
          inputClassName="!rounded-xl !p-3 !text-xs font-bold text-emerald-700"
        />

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Preferred Repayment Tenure (Months) <span className="text-rose-500">*</span>
          </label>
          <select
            value={personalLoanDetails.preferred_tenure || '36'}
            onChange={(e) =>
              setPersonalLoanDetails({ ...personalLoanDetails, preferred_tenure: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="12">12 Months (1 Year)</option>
            <option value="24">24 Months (2 Years)</option>
            <option value="36">36 Months (3 Years)</option>
            <option value="48">48 Months (4 Years)</option>
            <option value="60">60 Months (5 Years)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Loan Purpose</label>
          <select
            value={personalLoanDetails.loan_purpose}
            onChange={(e) =>
              setPersonalLoanDetails({ ...personalLoanDetails, loan_purpose: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="Home Improvement">Home Improvement / Interior</option>
            <option value="Medical Emergency">Medical Emergency / Hospitalization</option>
            <option value="Wedding / Family Event">Wedding / Family Function</option>
            <option value="Higher Education">Higher Education Abroad/Domestic</option>
            <option value="Debt Consolidation">Debt Consolidation (Close High-Interest Cards)</option>
            <option value="Travel / Vacation">Travel & Vacation</option>
            <option value="Business Expansion">Working Capital / Business Expansion</option>
            <option value="Other">Other Personal Requirement</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Purpose Details / Remarks</label>
          <input
            type="text"
            placeholder="Additional notes (Optional)"
            value={personalLoanDetails.other}
            onChange={(e) =>
              setPersonalLoanDetails({ ...personalLoanDetails, other: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-emerald-600"
          />
        </div>
      </div>
    </div>
  )
}

export default PersonalLoanStepSection
