import React from 'react'
import { useTranslation } from 'react-i18next'

interface CustomerMobileFormProps {
  mobile: string
  setMobile: (m: string) => void
  error: string | null
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export const CustomerMobileForm: React.FC<CustomerMobileFormProps> = ({
  mobile,
  setMobile,
  error,
  isLoading,
  onSubmit,
}) => {
  const { t } = useTranslation()

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
          {t('auth.customer.mobileLabel')}
        </label>
        <input
          required
          type="tel"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          placeholder={t('auth.customer.mobilePlaceholder')}
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.99]"
      >
        {isLoading ? t('common.actions.loading') : t('auth.customer.sendOtpBtn')}
      </button>
    </form>
  )
}

export default CustomerMobileForm
