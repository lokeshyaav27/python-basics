import React from 'react'
import { CurrencyInput } from '../../../components/CurrencyInput'

interface Step3SecondaryFieldsProps {
  financialInfo: {
    monthly_obligation: string
    existing_emi: string
    cibil_score: string
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
      <CurrencyInput
        label="6. Monthly Living / Household Obligations (₹)"
        placeholder="e.g. 20,000 (Optional)"
        value={financialInfo.monthly_obligation}
        onChange={(val) =>
          setFinancialInfo({ ...financialInfo, monthly_obligation: val })
        }
      />

      {/* 7. Existing Ongoing EMIs */}
      <CurrencyInput
        label="7. Existing Monthly EMIs (₹)"
        placeholder="e.g. 15,000 (0 if none)"
        value={financialInfo.existing_emi}
        onChange={(val) =>
          setFinancialInfo({ ...financialInfo, existing_emi: val })
        }
      />

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
    </>
  )
}

export default Step3SecondaryFields
