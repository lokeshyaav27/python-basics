import React from 'react'
import { HomeLoanDetailsData } from '../../../services/loanApplications'

interface HomeLoanInsuranceFieldsProps {
  homeDetails: HomeLoanDetailsData
  setHomeDetails: React.Dispatch<React.SetStateAction<HomeLoanDetailsData>>
  isEditing: boolean
}

export const HomeLoanInsuranceFields: React.FC<HomeLoanInsuranceFieldsProps> = ({
  homeDetails,
  setHomeDetails,
  isEditing,
}) => {
  return (
    <>
      {/* 8. Part Property */}
      <div>
        <label className="text-slate-500 block mb-1 font-medium">8. Part Property</label>
        {isEditing ? (
          <select
            value={homeDetails.isPartProperty ? 'true' : 'false'}
            onChange={(e) =>
              setHomeDetails({ ...homeDetails, isPartProperty: e.target.value === 'true' })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
          >
            <option value="false">No (Entire Property)</option>
            <option value="true">Yes (Sub-divided portion)</option>
          </select>
        ) : (
          <span className="font-bold text-slate-800">
            {homeDetails.isPartProperty ? 'Yes (Sub-divided)' : 'No (Entire Unit)'}
          </span>
        )}
      </div>

      {/* 9. Female Co-Applicant */}
      <div>
        <label className="text-slate-500 block mb-1 font-medium">9. Female Co-Applicant</label>
        {isEditing ? (
          <select
            value={homeDetails.femaleCoApplicant ? 'true' : 'false'}
            onChange={(e) =>
              setHomeDetails({ ...homeDetails, femaleCoApplicant: e.target.value === 'true' })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
          >
            <option value="false">No</option>
            <option value="true">Yes (0.05% Interest Concession)</option>
          </select>
        ) : (
          <span className="font-bold text-slate-800">
            {homeDetails.femaleCoApplicant ? '✅ Yes (Concession Applied)' : 'No'}
          </span>
        )}
      </div>

      {/* 10. Property Insurance */}
      <div>
        <label className="text-slate-500 block mb-1 font-medium">10. Property Insurance</label>
        {isEditing ? (
          <select
            value={homeDetails.propertyInsurance !== false ? 'true' : 'false'}
            onChange={(e) =>
              setHomeDetails({ ...homeDetails, propertyInsurance: e.target.value === 'true' })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
          >
            <option value="true">Opted</option>
            <option value="false">Not Opted</option>
          </select>
        ) : (
          <span className="font-bold text-slate-800">
            {homeDetails.propertyInsurance !== false ? '✅ Opted' : 'Not Opted'}
          </span>
        )}
      </div>

      {/* 11. Applicant Insurance */}
      <div>
        <label className="text-slate-500 block mb-1 font-medium">11. Loan Suraksha Life Cover</label>
        {isEditing ? (
          <select
            value={homeDetails.applicantInsurance !== false ? 'true' : 'false'}
            onChange={(e) =>
              setHomeDetails({ ...homeDetails, applicantInsurance: e.target.value === 'true' })
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
          >
            <option value="true">Opted</option>
            <option value="false">Not Opted</option>
          </select>
        ) : (
          <span className="font-bold text-slate-800">
            {homeDetails.applicantInsurance !== false ? '✅ Opted' : 'Not Opted'}
          </span>
        )}
      </div>
    </>
  )
}

export default HomeLoanInsuranceFields
