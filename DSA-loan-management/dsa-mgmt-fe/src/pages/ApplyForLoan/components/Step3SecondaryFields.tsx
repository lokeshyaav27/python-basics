import React from 'react'

interface Step3SecondaryFieldsProps {
  financialInfo: {
    monthly_obligation: string
    existing_emi: string
    cibil_score: string
    loan_amount_required: string
    preferred_tenure: string
  }
  setFinancialInfo: React.Dispatch<React.SetStateAction<any>>
}

export const Step3SecondaryFields: React.FC<Step3SecondaryFieldsProps> = ({
  financialInfo,
  setFinancialInfo,
}) => {
  return (
    <>
      {/* 6. Monthly Household Obligations */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          6. Monthly Living / Household Obligations (₹)
        </label>
        <input
          type="number"
          placeholder="e.g. 20000 (Optional)"
          value={financialInfo.monthly_obligation}
          onChange={(e) =>
            setFinancialInfo({ ...financialInfo, monthly_obligation: e.target.value })
          }
          className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition"
        />
      </div>

      {/* 7. Existing Ongoing EMIs */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          7. Existing Monthly EMIs (₹)
        </label>
        <input
          type="number"
          placeholder="e.g. 15000 (0 if none)"
          value={financialInfo.existing_emi}
          onChange={(e) =>
            setFinancialInfo({ ...financialInfo, existing_emi: e.target.value })
          }
          className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition"
        />
      </div>

      {/* 8. Estimated CIBIL Score */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          8. Approximate CIBIL / Credit Score <span className="text-rose-500">*</span>
        </label>
        <select
          value={financialInfo.cibil_score}
          onChange={(e) =>
            setFinancialInfo({ ...financialInfo, cibil_score: e.target.value })
          }
          className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition bg-white font-medium"
        >
          <option value="780">780+ (Excellent Credit Record)</option>
          <option value="750">750 - 779 (Good / Prime)</option>
          <option value="700">700 - 749 (Standard Average)</option>
          <option value="650">650 - 699 (Fair / Marginal)</option>
          <option value="600">Below 650 (Poor / Rebuilding)</option>
        </select>
      </div>

      {/* 9. Required Loan Amount */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          9. Required Loan Amount (₹) <span className="text-rose-500">*</span>
        </label>
        <input
          required
          type="number"
          placeholder="e.g. 3500000"
          value={financialInfo.loan_amount_required}
          onChange={(e) =>
            setFinancialInfo({ ...financialInfo, loan_amount_required: e.target.value })
          }
          className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition font-bold text-blue-700"
        />
      </div>

      {/* 10. Preferred Tenure */}
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          10. Preferred Repayment Tenure (Months) <span className="text-rose-500">*</span>
        </label>
        <select
          value={financialInfo.preferred_tenure}
          onChange={(e) =>
            setFinancialInfo({ ...financialInfo, preferred_tenure: e.target.value })
          }
          className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition bg-white"
        >
          <option value="12">12 Months (1 Year)</option>
          <option value="24">24 Months (2 Years)</option>
          <option value="36">36 Months (3 Years)</option>
          <option value="60">60 Months (5 Years)</option>
          <option value="84">84 Months (7 Years)</option>
          <option value="120">120 Months (10 Years)</option>
          <option value="180">180 Months (15 Years)</option>
          <option value="240">240 Months (20 Years)</option>
          <option value="300">300 Months (25 Years)</option>
          <option value="360">360 Months (30 Years)</option>
        </select>
      </div>
    </>
  )
}

export default Step3SecondaryFields
