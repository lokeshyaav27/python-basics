import React from 'react'
import { ClientGeneralDetailsData } from '../../../services/loanApplications'
import { CibilBadge, formatCurrency } from './StatusBadges'

interface GeneralFinancialFieldsProps {
  generalDetails: ClientGeneralDetailsData
  setGeneralDetails: React.Dispatch<React.SetStateAction<ClientGeneralDetailsData>>
  isEditing: boolean
}

export const GeneralFinancialFields: React.FC<GeneralFinancialFieldsProps> = ({
  generalDetails,
  setGeneralDetails,
  isEditing,
}) => {
  return (
    <>
      {/* 6. Monthly Net Income */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">6. Monthly Net Income</label>
        {isEditing ? (
          <input
            type="number"
            value={generalDetails.monthly_income ?? ''}
            onChange={(e) =>
              setGeneralDetails({
                ...generalDetails,
                monthly_income: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          />
        ) : (
          <span className="font-bold text-emerald-700">{formatCurrency(generalDetails.monthly_income)}</span>
        )}
      </div>

      {/* 7. Monthly Household Obligations */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">7. Monthly Obligations</label>
        {isEditing ? (
          <input
            type="number"
            value={generalDetails.monthly_obligation ?? ''}
            onChange={(e) =>
              setGeneralDetails({
                ...generalDetails,
                monthly_obligation: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          />
        ) : (
          <span className="font-bold text-slate-800">{formatCurrency(generalDetails.monthly_obligation)}</span>
        )}
      </div>

      {/* 8. Existing Ongoing EMIs */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">8. Existing EMIs</label>
        {isEditing ? (
          <input
            type="number"
            value={generalDetails.existing_emi ?? ''}
            onChange={(e) =>
              setGeneralDetails({
                ...generalDetails,
                existing_emi: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          />
        ) : (
          <span className="font-bold text-slate-800">{formatCurrency(generalDetails.existing_emi)}</span>
        )}
      </div>

      {/* 9. CIBIL Score */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">9. CIBIL Score</label>
        {isEditing ? (
          <input
            type="number"
            value={generalDetails.cibil_score ?? ''}
            onChange={(e) =>
              setGeneralDetails({
                ...generalDetails,
                cibil_score: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          />
        ) : (
          <CibilBadge score={generalDetails.cibil_score} />
        )}
      </div>

      {/* 10. Required Loan Amount */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">10. Loan Amount Required</label>
        {isEditing ? (
          <input
            type="number"
            value={generalDetails.loan_amount_required ?? ''}
            onChange={(e) =>
              setGeneralDetails({
                ...generalDetails,
                loan_amount_required: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          />
        ) : (
          <span className="font-extrabold text-blue-700">{formatCurrency(generalDetails.loan_amount_required)}</span>
        )}
      </div>

      {/* 11. Preferred Tenure */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">11. Preferred Tenure</label>
        {isEditing ? (
          <input
            type="number"
            value={generalDetails.preferred_tenure ?? ''}
            onChange={(e) =>
              setGeneralDetails({
                ...generalDetails,
                preferred_tenure: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          />
        ) : (
          <span className="font-bold text-slate-800">
            {generalDetails.preferred_tenure
              ? `${generalDetails.preferred_tenure} Months (${(generalDetails.preferred_tenure / 12).toFixed(1)} Yrs)`
              : '—'}
          </span>
        )}
      </div>
    </>
  )
}

export default GeneralFinancialFields
