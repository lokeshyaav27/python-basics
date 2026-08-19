import React from 'react'

interface StepIndicatorProps {
  currentStep: number
}

const STEPS = [
  { num: 1, title: 'Loan Product', icon: '🏷️' },
  { num: 2, title: 'Your Details', icon: '👤' },
  { num: 3, title: 'Financial Profile', icon: '💼' },
  { num: 4, title: 'Loan Details', icon: '📋' },
]

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
        <span>⚡ Fast & Easy Process</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
        Apply for a Loan
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
        Complete the steps below to find the best interest rates and match with top partner banks.
      </p>

      {/* Progress Stepper Bar */}
      <div className="mt-8 grid grid-cols-4 gap-2 md:gap-4 max-w-3xl mx-auto">
        {STEPS.map((s) => {
          const isCompleted = currentStep > s.num
          const isCurrent = currentStep === s.num
          return (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold transition shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : s.num}
              </div>
              <span
                className={`mt-2 text-[11px] md:text-xs font-semibold text-center hidden sm:block ${
                  isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {s.title}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepIndicator
