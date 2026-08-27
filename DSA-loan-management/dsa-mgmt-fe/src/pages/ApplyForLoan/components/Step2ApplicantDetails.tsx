import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../constants'

interface Step2ApplicantDetailsProps {
  basicInfo: { name: string; email: string; mobile: string }
  setBasicInfo: React.Dispatch<React.SetStateAction<{ name: string; email: string; mobile: string }>>
  isUserLoggedInCustomer: boolean
  onNext: () => void
  onPrev: () => void
}

export const Step2ApplicantDetails: React.FC<Step2ApplicantDetailsProps> = ({
  basicInfo,
  setBasicInfo,
  isUserLoggedInCustomer,
  onNext,
  onPrev,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Step 2: Basic Contact Details</h2>
        <p className="text-xs text-slate-500 mt-1">
          Provide your name, email and mobile number for verification and status tracking
        </p>
      </div>

      {isUserLoggedInCustomer ? (
        <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span>
              <strong>Verified Profile:</strong> Contact details are locked to your logged-in customer account.
            </span>
          </div>
          <span className="text-[11px] font-bold bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full">
            Verified
          </span>
        </div>
      ) : (
        <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-4 text-xs text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>Already have an account with us?</span>
          </div>
          <Link
            to={ROUTES.CUSTOMER_LOGIN}
            className="font-bold underline hover:text-blue-900 ml-2 whitespace-nowrap"
          >
            Login via OTP →
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Full Name (as per PAN / Aadhaar) <span className="text-rose-500">*</span>
            </label>
            {isUserLoggedInCustomer && (
              <span className="text-[10px] font-medium text-slate-400 italic">Locked to logged-in profile</span>
            )}
          </div>
          <input
            required
            type="text"
            disabled={isUserLoggedInCustomer}
            placeholder="e.g. Rahul Sharma"
            value={basicInfo.name}
            onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Email Address <span className="text-rose-500">*</span>
            </label>
            {isUserLoggedInCustomer && (
              <span className="text-[10px] font-medium text-slate-400 italic">Locked</span>
            )}
          </div>
          <input
            required
            type="email"
            disabled={isUserLoggedInCustomer}
            placeholder="e.g. rahul.sharma@example.com"
            value={basicInfo.email}
            onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Mobile Number (10 Digits) <span className="text-rose-500">*</span>
            </label>
            {isUserLoggedInCustomer && (
              <span className="text-[10px] font-medium text-slate-400 italic">Locked</span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-sm font-semibold text-slate-400">
              +91
            </span>
            <input
              required
              type="tel"
              disabled={isUserLoggedInCustomer}
              maxLength={10}
              placeholder="9876543210"
              value={basicInfo.mobile}
              onChange={(e) => setBasicInfo({ ...basicInfo, mobile: e.target.value.replace(/\D/g, '') })}
              className="w-full rounded-2xl border border-slate-300 py-3.5 pl-14 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed transition font-mono font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-2xl border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95"
        >
          Continue to Financial Profile →
        </button>
      </div>
    </div>
  )
}

export default Step2ApplicantDetails
