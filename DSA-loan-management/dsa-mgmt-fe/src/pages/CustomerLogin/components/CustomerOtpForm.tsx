import React from 'react'
import { useTranslation } from 'react-i18next'

interface CustomerOtpFormProps {
  otp: string
  setOtp: (o: string) => void
  error: string | null
  isLoading: boolean
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
  onResend: () => void
}

export const CustomerOtpForm: React.FC<CustomerOtpFormProps> = ({
  otp,
  setOtp,
  error,
  isLoading,
  onBack,
  onSubmit,
  onResend,
}) => {
  const { t } = useTranslation()

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
            {t('auth.customer.enterOtp')}
          </label>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-blue-600 hover:underline"
          >
            {t('auth.customer.changeMobile')}
          </button>
        </div>
        <input
          required
          type="text"
          maxLength={6}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          placeholder="• • • •"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Demo code: <span className="font-mono font-bold text-slate-600">1234</span>
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition active:scale-[0.99]"
      >
        {isLoading ? t('common.actions.loading') : t('auth.customer.verifyLoginBtn')}
      </button>

      <button
        type="button"
        onClick={onResend}
        disabled={isLoading}
        className="w-full text-center text-xs text-slate-500 hover:text-blue-600 py-1 font-medium"
      >
        {t('auth.customer.resendOtp')}
      </button>
    </form>
  )
}

export default CustomerOtpForm
