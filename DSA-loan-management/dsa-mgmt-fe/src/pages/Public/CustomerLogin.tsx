import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { requestCustomerOtp, verifyCustomerOtp } from '../../services/auth'
import { ROUTES } from '../../constants/routes'

const CustomerLogin: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    const m = searchParams.get('mobile')
    if (m) {
      setMobile(m.trim())
    }
  }, [searchParams])

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!mobile.trim()) {
      setError('Please enter your mobile number')
      return
    }
    setLoading(true)
    try {
      await requestCustomerOtp(mobile.trim())
      setOtpSent(true)
      message.success('OTP sent successfully! (Demo OTP: 1234)')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!otp.trim()) {
      setError('Please enter the OTP received')
      return
    }
    setLoading(true)
    try {
      const res = await verifyCustomerOtp(mobile.trim(), otp.trim())
      const user = res?.user || {}
      const name = user.name || mobile.trim()
      auth.login(res.accessToken, {
        id: user.id,
        name,
        email: user.email,
        mobile: user.mobile || mobile.trim(),
        uniqueCustomerId: user.uniqueCustomerId,
        role: 'customer',
      })
      message.success(`Welcome back, ${name}!`)
      nav(ROUTES.CUSTOMER.LOANS)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white shadow-md">
            D
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t('auth.customer.badge')}</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{t('auth.customer.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('auth.customer.subtitle')}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={sendOtp} className="space-y-4">
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              type="submit"
            >
              {loading ? t('common.actions.loading') : t('auth.customer.sendOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-4">
            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-center">
              <span className="text-xs text-slate-600">OTP sent to </span>
              <span className="text-xs font-bold text-slate-900">{mobile}</span>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="ml-2 text-xs text-blue-600 font-semibold underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                {t('auth.customer.otpLabel')}
              </label>
              <input
                required
                type="text"
                maxLength={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg tracking-widest font-mono font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1 text-center">{t('auth.customer.demoHint')}</p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
              type="submit"
            >
              {loading ? t('common.actions.loading') : t('auth.customer.verifyOtp')}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Want to explore loans?{' '}
            <Link to={ROUTES.PRODUCTS} className="font-semibold text-blue-600 hover:underline">
              {t('common.nav.products')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin
