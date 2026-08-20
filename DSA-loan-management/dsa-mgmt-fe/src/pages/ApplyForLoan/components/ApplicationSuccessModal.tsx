import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../constants'

interface ApplicationSuccessModalProps {
  applicationId?: number
  isUserLoggedInCustomer: boolean
}

export const ApplicationSuccessModal: React.FC<ApplicationSuccessModalProps> = ({
  applicationId,
  isUserLoggedInCustomer,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-4xl shadow-inner">
          🎉
        </div>

        <div>
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 mb-2">
            Application Submitted Successfully
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">
            Application #{applicationId || 'NEW'}
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your loan application has been registered. Our underwriting algorithm and assigned DSA officer are matching your profile with partner banks.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>✅</span>
            <span>Profile captured with 11 financial metrics</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>✅</span>
            <span>Instant policy & eligibility checking started</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>✅</span>
            <span>SMS & Email status updates enabled</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          {applicationId && (
            <Link
              to={`${ROUTES.SHARED.CHECK_ELIGIBILITY}?applicationId=${applicationId}`}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition"
            >
              Evaluate Instant Eligibility Matrix →
            </Link>
          )}

          {isUserLoggedInCustomer ? (
            <Link
              to={ROUTES.CUSTOMER.LOANS}
              className="w-full rounded-2xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              View My Applications in Portal
            </Link>
          ) : (
            <Link
              to={ROUTES.CUSTOMER_LOGIN}
              className="w-full rounded-2xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Login to Track Live Status
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationSuccessModal
