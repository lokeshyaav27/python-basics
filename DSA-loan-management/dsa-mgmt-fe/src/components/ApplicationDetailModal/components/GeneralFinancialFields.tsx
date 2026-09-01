import React from 'react'
import { ClientGeneralDetailsData } from '../../../services/loanApplications'
import { CibilBadge, formatCurrency } from './StatusBadges'
import { CurrencyInput } from '../../CurrencyInput'

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
          <CurrencyInput
            value={generalDetails.monthly_income ?? ''}
            onChange={(val) =>
              setGeneralDetails({
                ...generalDetails,
                monthly_income: val ? Number(val) : undefined,
              })
            }
            inputClassName="!rounded-lg !p-2 !text-xs"
          />
        ) : (
          <span className="font-bold text-emerald-700">{formatCurrency(generalDetails.monthly_income)}</span>
        )}
      </div>

      {/* 7. Monthly Household Obligations */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">7. Monthly Obligations</label>
        {isEditing ? (
          <CurrencyInput
            value={generalDetails.monthly_obligation ?? ''}
            onChange={(val) =>
              setGeneralDetails({
                ...generalDetails,
                monthly_obligation: val ? Number(val) : undefined,
              })
            }
            inputClassName="!rounded-lg !p-2 !text-xs"
          />
        ) : (
          <span className="font-bold text-slate-800">{formatCurrency(generalDetails.monthly_obligation)}</span>
        )}
      </div>

      {/* 8. Existing Ongoing EMIs */}
      <div>
        <label className="text-slate-400 block mb-1 font-medium">8. Existing EMIs</label>
        {isEditing ? (
          <CurrencyInput
            value={generalDetails.existing_emi ?? ''}
            onChange={(val) =>
              setGeneralDetails({
                ...generalDetails,
                existing_emi: val ? Number(val) : undefined,
              })
            }
            inputClassName="!rounded-lg !p-2 !text-xs"
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
    </>
  )
}

export default GeneralFinancialFields
