import React from 'react'
import { CurrencyInput } from '../../../components/CurrencyInput'

interface HomeLoanStepSectionProps {
  homeLoanDetails: any
  setHomeLoanDetails: React.Dispatch<React.SetStateAction<any>>
}

export const HomeLoanStepSection: React.FC<HomeLoanStepSectionProps> = ({
  homeLoanDetails,
  setHomeLoanDetails,
}) => {
  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🏠</span>
        <h3 className="text-sm font-bold text-blue-900">Home Loan / Property Information</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        <CurrencyInput
          required
          label="Property Market Value (₹)"
          placeholder="e.g. 50,00,000"
          value={homeLoanDetails.property_value}
          onChange={(val) =>
            setHomeLoanDetails({ ...homeLoanDetails, property_value: val })
          }
          inputClassName="!rounded-xl !p-3 !text-xs"
        />

        <CurrencyInput
          label="Down Payment Planned (₹)"
          placeholder="e.g. 10,00,000"
          value={homeLoanDetails.down_payment}
          onChange={(val) =>
            setHomeLoanDetails({ ...homeLoanDetails, down_payment: val })
          }
          inputClassName="!rounded-xl !p-3 !text-xs"
        />

        <div>
          <label className="font-bold text-slate-700 block mb-1">Property Location / City</label>
          <input
            type="text"
            placeholder="e.g. Sector 62, Noida"
            value={homeLoanDetails.property_location}
            onChange={(e) =>
              setHomeLoanDetails({ ...homeLoanDetails, property_location: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Property Usage</label>
          <select
            value={homeLoanDetails.propertyUsageType}
            onChange={(e) =>
              setHomeLoanDetails({ ...homeLoanDetails, propertyUsageType: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="Residential">Residential Self-Occupied / Rental</option>
            <option value="Commercial">Commercial Shop / Office</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Requirement State</label>
          <select
            value={homeLoanDetails.propertyRequirement}
            onChange={(e) =>
              setHomeLoanDetails({ ...homeLoanDetails, propertyRequirement: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="Ready to Move">Ready to Move</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Resale">Resale Property</option>
            <option value="Plot + Construction">Plot + Construction</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Property Type</label>
          <select
            value={homeLoanDetails.propertyType}
            onChange={(e) =>
              setHomeLoanDetails({ ...homeLoanDetails, propertyType: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="Apartment">Apartment / High-rise Flat</option>
            <option value="Independent House / Villa">Independent House / Villa</option>
            <option value="Commercial Shop / Office">Commercial Shop / Office</option>
            <option value="Residential Plot">Residential Plot</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Ownership / Title Status</label>
          <select
            value={homeLoanDetails.propertyStatus}
            onChange={(e) =>
              setHomeLoanDetails({ ...homeLoanDetails, propertyStatus: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="Freehold">Freehold Title (Clear Ownership)</option>
            <option value="Leasehold">Leasehold Authority (NOIDA/DDA etc)</option>
            <option value="Power of Attorney (POA)">Power of Attorney (POA / GPA)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Is Subdivided Portion?</label>
          <select
            value={homeLoanDetails.isPartProperty ? 'true' : 'false'}
            onChange={(e) =>
              setHomeLoanDetails({
                ...homeLoanDetails,
                isPartProperty: e.target.value === 'true',
              })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="false">No (Entire Legal Unit)</option>
            <option value="true">Yes (Sub-divided Floor / Floor-wise)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-emerald-800 block mb-1">
            Female Co-Applicant? (0.05% Rebate)
          </label>
          <select
            value={homeLoanDetails.femaleCoApplicant ? 'true' : 'false'}
            onChange={(e) =>
              setHomeLoanDetails({
                ...homeLoanDetails,
                femaleCoApplicant: e.target.value === 'true',
              })
            }
            className="w-full rounded-xl border border-emerald-300 p-3 text-xs bg-emerald-50/50 outline-none font-semibold text-emerald-900"
          >
            <option value="false">No</option>
            <option value="true">Yes (Avail Interest Discount)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Property Fire & Hazard Insurance</label>
          <select
            value={homeLoanDetails.propertyInsurance ? 'true' : 'false'}
            onChange={(e) =>
              setHomeLoanDetails({
                ...homeLoanDetails,
                propertyInsurance: e.target.value === 'true',
              })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="true">Opted (Recommended by Banks)</option>
            <option value="false">Not Opted</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Loan Suraksha Life Shield</label>
          <select
            value={homeLoanDetails.applicantInsurance ? 'true' : 'false'}
            onChange={(e) =>
              setHomeLoanDetails({
                ...homeLoanDetails,
                applicantInsurance: e.target.value === 'true',
              })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="true">Opted (Protect family against debt)</option>
            <option value="false">Not Opted</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default HomeLoanStepSection
