import React from 'react'
import { Step3SecondaryFields } from './Step3SecondaryFields'

interface Step3FinancialDetailsProps {
  financialInfo: {
    age: string
    gender: string
    location: string
    employment_type: string
    isSalaried: boolean
    monthly_income: string
    monthly_obligation: string
    existing_emi: string
    cibil_score: string
    loan_amount_required: string
    preferred_tenure: string
  }
  setFinancialInfo: React.Dispatch<React.SetStateAction<any>>
  onNext: () => void
  onPrev: () => void
}

export const Step3FinancialDetails: React.FC<Step3FinancialDetailsProps> = ({
  financialInfo,
  setFinancialInfo,
  onNext,
  onPrev,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 3: Personal & Financial Profile</h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill in your employment and borrowing parameters so partner banks can assess eligibility
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full hidden sm:inline-block">
          11 Key Fields
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Age */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            1. Applicant Age (Years) <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="number"
            min={18}
            max={75}
            placeholder="e.g. 32"
            value={financialInfo.age}
            onChange={(e) => setFinancialInfo({ ...financialInfo, age: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition"
          />
        </div>

        {/* 2. Gender */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            2. Gender <span className="text-rose-500">*</span>
          </label>
          <select
            value={financialInfo.gender}
            onChange={(e) => setFinancialInfo({ ...financialInfo, gender: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition bg-white"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* 3. Location / City */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            3. City / Residence Location <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Mumbai, Delhi, Bengaluru"
            value={financialInfo.location}
            onChange={(e) => setFinancialInfo({ ...financialInfo, location: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition"
          />
        </div>

        {/* 4. Employment Type */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            4. Employment Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={financialInfo.employment_type}
            onChange={(e) =>
              setFinancialInfo({
                ...financialInfo,
                employment_type: e.target.value,
                isSalaried: e.target.value === 'Salaried',
              })
            }
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition bg-white"
          >
            <option value="Salaried">Salaried (Private / Govt)</option>
            <option value="Self-Employed">Self-Employed Professional (Doctor, CA, etc.)</option>
            <option value="Business">Business Owner / Trader</option>
          </select>
        </div>

        {/* 5. Monthly Net Income */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            5. Monthly Net In-Hand Income (₹) <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="number"
            placeholder="e.g. 85000"
            value={financialInfo.monthly_income}
            onChange={(e) => setFinancialInfo({ ...financialInfo, monthly_income: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition"
          />
        </div>

        {/* 6 - 10. Secondary Financial Parameters */}
        <Step3SecondaryFields
          financialInfo={financialInfo}
          setFinancialInfo={setFinancialInfo}
        />
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-2xl border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95"
        >
          Continue to Specific Details →
        </button>
      </div>
    </div>
  )
}

export default Step3FinancialDetails
