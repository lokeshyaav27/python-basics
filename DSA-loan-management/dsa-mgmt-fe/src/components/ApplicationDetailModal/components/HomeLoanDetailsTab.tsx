import React from 'react'
import { HomeLoanDetailsData } from '../../../services/loanApplications'
import { formatCurrency } from './StatusBadges'
import { HomeLoanInsuranceFields } from './HomeLoanInsuranceFields'

interface HomeLoanDetailsTabProps {
  homeDetails: HomeLoanDetailsData
  setHomeDetails: React.Dispatch<React.SetStateAction<HomeLoanDetailsData>>
  isEditing: boolean
}

export const HomeLoanDetailsTab: React.FC<HomeLoanDetailsTabProps> = ({
  homeDetails,
  setHomeDetails,
  isEditing,
}) => {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
          <span>🏠</span> Home Loan Details (All Captured Fields)
        </h4>
        <span className="text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded">
          Property Evaluation
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* 1. Property Value */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">1. Property Value</label>
          {isEditing ? (
            <input
              type="number"
              value={homeDetails.property_value ?? ''}
              onChange={(e) =>
                setHomeDetails({
                  ...homeDetails,
                  property_value: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">{formatCurrency(homeDetails.property_value)}</span>
          )}
        </div>

        {/* 2. Down Payment */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">2. Down Payment</label>
          {isEditing ? (
            <input
              type="number"
              value={homeDetails.down_payment ?? ''}
              onChange={(e) =>
                setHomeDetails({
                  ...homeDetails,
                  down_payment: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">{formatCurrency(homeDetails.down_payment)}</span>
          )}
        </div>

        {/* 3. Property Location */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">3. Property Location</label>
          {isEditing ? (
            <input
              value={homeDetails.property_location ?? ''}
              onChange={(e) =>
                setHomeDetails({ ...homeDetails, property_location: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">{homeDetails.property_location || '—'}</span>
          )}
        </div>

        {/* 4. Property Usage Type */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">4. Property Usage</label>
          {isEditing ? (
            <select
              value={homeDetails.propertyUsageType ?? 'Residential'}
              onChange={(e) =>
                setHomeDetails({ ...homeDetails, propertyUsageType: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{homeDetails.propertyUsageType || 'Residential'}</span>
          )}
        </div>

        {/* 5. Property Requirement */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">5. Property Requirement</label>
          {isEditing ? (
            <select
              value={homeDetails.propertyRequirement ?? 'Ready to Move'}
              onChange={(e) =>
                setHomeDetails({ ...homeDetails, propertyRequirement: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="Ready to Move">Ready to Move</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Resale">Resale Property</option>
              <option value="Plot + Construction">Plot + Construction</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{homeDetails.propertyRequirement || 'Ready to Move'}</span>
          )}
        </div>

        {/* 6. Property Type */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">6. Property Type</label>
          {isEditing ? (
            <select
              value={homeDetails.propertyType ?? 'Apartment'}
              onChange={(e) =>
                setHomeDetails({ ...homeDetails, propertyType: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="Apartment">Apartment / Flat</option>
              <option value="Independent House / Villa">Independent House / Villa</option>
              <option value="Commercial Shop / Office">Commercial Shop / Office</option>
              <option value="Residential Plot">Residential Plot</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{homeDetails.propertyType || 'Apartment'}</span>
          )}
        </div>

        {/* 7. Property Ownership / Status */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">7. Property Ownership / Title</label>
          {isEditing ? (
            <select
              value={homeDetails.propertyStatus ?? 'Freehold'}
              onChange={(e) =>
                setHomeDetails({ ...homeDetails, propertyStatus: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="Freehold">Freehold Title</option>
              <option value="Leasehold">Leasehold Authority</option>
              <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{homeDetails.propertyStatus || 'Freehold'}</span>
          )}
        </div>

        {/* 8 - 11. Insurance & Sub-division Fields */}
        <HomeLoanInsuranceFields
          homeDetails={homeDetails}
          setHomeDetails={setHomeDetails}
          isEditing={isEditing}
        />
      </div>
    </div>
  )
}

export default HomeLoanDetailsTab
