import React from 'react'

interface CarLoanStepSectionProps {
  carLoanDetails: any
  setCarLoanDetails: React.Dispatch<React.SetStateAction<any>>
}

export const CarLoanStepSection: React.FC<CarLoanStepSectionProps> = ({
  carLoanDetails,
  setCarLoanDetails,
}) => {
  return (
    <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🚗</span>
        <h3 className="text-sm font-bold text-indigo-900">Car / Vehicle Information</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Vehicle Condition</label>
          <select
            value={carLoanDetails.new_or_used}
            onChange={(e) =>
              setCarLoanDetails({ ...carLoanDetails, new_or_used: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none"
          >
            <option value="New">Brand New Car from Showroom</option>
            <option value="Used">Pre-Owned / Used Car</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            On-Road / Quotation Price (₹) <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="number"
            placeholder="e.g. 1200000"
            value={carLoanDetails.car_value}
            onChange={(e) =>
              setCarLoanDetails({ ...carLoanDetails, car_value: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Down Payment Planned (₹)</label>
          <input
            type="number"
            placeholder="e.g. 200000"
            value={carLoanDetails.down_payment}
            onChange={(e) =>
              setCarLoanDetails({ ...carLoanDetails, down_payment: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Vehicle Age (Years)</label>
          <input
            type="number"
            min={0}
            max={15}
            placeholder="0 if brand new"
            value={carLoanDetails.vehicle_age}
            onChange={(e) =>
              setCarLoanDetails({ ...carLoanDetails, vehicle_age: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-indigo-600"
          />
        </div>
      </div>
    </div>
  )
}

export default CarLoanStepSection
