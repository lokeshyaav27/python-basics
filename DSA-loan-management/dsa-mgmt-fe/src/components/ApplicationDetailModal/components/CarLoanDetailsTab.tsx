import React from 'react'
import { CarLoanDetailsData } from '../../../services/loanApplications'
import { formatCurrency } from './StatusBadges'

interface CarLoanDetailsTabProps {
  carDetails: CarLoanDetailsData
  setCarDetails: React.Dispatch<React.SetStateAction<CarLoanDetailsData>>
  isEditing: boolean
}

export const CarLoanDetailsTab: React.FC<CarLoanDetailsTabProps> = ({
  carDetails,
  setCarDetails,
  isEditing,
}) => {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
          <span>🚗</span> Car Loan Details (All Captured Fields)
        </h4>
        <span className="text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">
          Vehicle Details
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* 1. Vehicle Type */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">1. Vehicle Condition</label>
          {isEditing ? (
            <select
              value={carDetails.new_or_used ?? 'New'}
              onChange={(e) => setCarDetails({ ...carDetails, new_or_used: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            >
              <option value="New">Brand New Car</option>
              <option value="Used">Pre-Owned / Used Car</option>
            </select>
          ) : (
            <span className="font-bold text-slate-800">{carDetails.new_or_used || 'New'}</span>
          )}
        </div>

        {/* 2. Car Value */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">2. Vehicle Value / Quotation</label>
          {isEditing ? (
            <input
              type="number"
              value={carDetails.car_value ?? ''}
              onChange={(e) =>
                setCarDetails({
                  ...carDetails,
                  car_value: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">{formatCurrency(carDetails.car_value)}</span>
          )}
        </div>

        {/* 3. Down Payment */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">3. Down Payment</label>
          {isEditing ? (
            <input
              type="number"
              value={carDetails.down_payment ?? ''}
              onChange={(e) =>
                setCarDetails({
                  ...carDetails,
                  down_payment: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">{formatCurrency(carDetails.down_payment)}</span>
          )}
        </div>

        {/* 4. Vehicle Age */}
        <div>
          <label className="text-slate-500 block mb-1 font-medium">4. Vehicle Age</label>
          {isEditing ? (
            <input
              type="number"
              value={carDetails.vehicle_age ?? 0}
              onChange={(e) =>
                setCarDetails({ ...carDetails, vehicle_age: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          ) : (
            <span className="font-bold text-slate-800">
              {carDetails.vehicle_age ? `${carDetails.vehicle_age} Years` : '0 (Brand New)'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CarLoanDetailsTab
