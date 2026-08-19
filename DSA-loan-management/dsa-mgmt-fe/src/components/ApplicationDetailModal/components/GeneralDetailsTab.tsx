import React from 'react'
import { ClientGeneralDetailsData } from '../../../services/loanApplications'
import { GeneralFinancialFields } from './GeneralFinancialFields'

interface GeneralDetailsTabProps {
  generalDetails: ClientGeneralDetailsData
  setGeneralDetails: React.Dispatch<React.SetStateAction<ClientGeneralDetailsData>>
  isEditing: boolean
}

export const GeneralDetailsTab: React.FC<GeneralDetailsTabProps> = ({
  generalDetails,
  setGeneralDetails,
  isEditing,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span>📊</span> Personal & Financial Profile (11 Captured Fields)
        </h4>
        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          Client General Details
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* 1. Age */}
        <div>
          <label className="text-slate-400 block mb-1 font-medium">1. Applicant Age</label>
          {isEditing ? (
            <input
              type="number"
              value={generalDetails.age ?? ''}
              onChange={(e) =>
                setGeneralDetails({
                  ...generalDetails,
                  age: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          ) : (
            <span className="font-bold text-slate-800">{generalDetails.age ? `${generalDetails.age} Years` : '—'}</span>
          )}
        </div>

        {/* 2. Gender */}
        <div>
          <label className="text-slate-400 block mb-1 font-medium">2. Gender</label>
          {isEditing ? (
            <select
              value={generalDetails.gender ?? ''}
              onChange={(e) => setGeneralDetails({ ...generalDetails, gender: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{generalDetails.gender || '—'}</span>
          )}
        </div>

        {/* 3. Location / City */}
        <div>
          <label className="text-slate-400 block mb-1 font-medium">3. Location / City</label>
          {isEditing ? (
            <input
              value={generalDetails.location ?? ''}
              onChange={(e) => setGeneralDetails({ ...generalDetails, location: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          ) : (
            <span className="font-bold text-slate-800">{generalDetails.location || '—'}</span>
          )}
        </div>

        {/* 4. Employment Type */}
        <div>
          <label className="text-slate-400 block mb-1 font-medium">4. Employment Type</label>
          {isEditing ? (
            <select
              value={generalDetails.employment_type ?? 'Salaried'}
              onChange={(e) =>
                setGeneralDetails({ ...generalDetails, employment_type: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed">Self-Employed Professional</option>
              <option value="Business">Business Owner / Trader</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{generalDetails.employment_type || 'Salaried'}</span>
          )}
        </div>

        {/* 5. Salaried Flag */}
        <div>
          <label className="text-slate-400 block mb-1 font-medium">5. Salaried / Self-Employed</label>
          {isEditing ? (
            <select
              value={generalDetails.isSalaried !== false ? 'true' : 'false'}
              onChange={(e) =>
                setGeneralDetails({ ...generalDetails, isSalaried: e.target.value === 'true' })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="true">Salaried (W-2 / Monthly Payroll)</option>
              <option value="false">Self-Employed / Business</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">
              {generalDetails.isSalaried !== false ? 'Salaried Employee' : 'Self-Employed / Business'}
            </span>
          )}
        </div>

        {/* 6 - 11. Financial Parameters */}
        <GeneralFinancialFields
          generalDetails={generalDetails}
          setGeneralDetails={setGeneralDetails}
          isEditing={isEditing}
        />
      </div>
    </div>
  )
}

export default GeneralDetailsTab
