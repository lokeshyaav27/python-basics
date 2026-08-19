import React from 'react'
import { HomeLoanStepSection } from './HomeLoanStepSection'
import { CarLoanStepSection } from './CarLoanStepSection'
import { PersonalLoanStepSection } from './PersonalLoanStepSection'

interface Step4ProductSpecificDetailsProps {
  isHomeLoan: boolean
  isCarLoan: boolean
  isPersonalLoan: boolean
  homeLoanDetails: any
  setHomeLoanDetails: React.Dispatch<React.SetStateAction<any>>
  carLoanDetails: any
  setCarLoanDetails: React.Dispatch<React.SetStateAction<any>>
  personalLoanDetails: any
  setPersonalLoanDetails: React.Dispatch<React.SetStateAction<any>>
  isSubmitting: boolean
  onPrev: () => void
  onSubmit: (e: React.FormEvent) => void
}

export const Step4ProductSpecificDetails: React.FC<Step4ProductSpecificDetailsProps> = ({
  isHomeLoan,
  isCarLoan,
  isPersonalLoan,
  homeLoanDetails,
  setHomeLoanDetails,
  carLoanDetails,
  setCarLoanDetails,
  personalLoanDetails,
  setPersonalLoanDetails,
  isSubmitting,
  onPrev,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Step 4: Product Specific Details</h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed inputs required for final underwriting and policy doc evaluation
        </p>
      </div>

      {isHomeLoan && (
        <HomeLoanStepSection
          homeLoanDetails={homeLoanDetails}
          setHomeLoanDetails={setHomeLoanDetails}
        />
      )}

      {isCarLoan && (
        <CarLoanStepSection
          carLoanDetails={carLoanDetails}
          setCarLoanDetails={setCarLoanDetails}
        />
      )}

      {isPersonalLoan && (
        <PersonalLoanStepSection
          personalLoanDetails={personalLoanDetails}
          setPersonalLoanDetails={setPersonalLoanDetails}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-2xl border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-emerald-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition active:scale-95 flex items-center gap-2"
        >
          {isSubmitting ? (
            <span>Processing Application…</span>
          ) : (
            <span>🚀 Submit Loan Application</span>
          )}
        </button>
      </div>
    </form>
  )
}

export default Step4ProductSpecificDetails
