import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { requestCustomerOtp, verifyCustomerOtp } from '../../services/auth'
import { message } from 'antd'

export default function CustomerLogin() {
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const nav = useNavigate()

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
      const customer = res?.customer || {}
      const name = customer.name || mobile.trim()
      auth.login(name, 'customer', {
        id: customer.id,
        email: customer.email,
        mobile: customer.mobile || mobile.trim(),
      })
      message.success(`Welcome back, ${name}!`)
      nav('/customer/loans')
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
          <h2 className="text-2xl font-bold text-slate-900">Customer Login</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in with your registered mobile number to track your loan status
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Mobile Number
              </label>
              <input
                required
                type="tel"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="Enter 10-digit mobile number"
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
              {loading ? 'Sending OTP…' : 'Send OTP'}
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
                Enter 4-Digit OTP
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
              <p className="text-[11px] text-slate-400 mt-1 text-center">Use demo OTP: 1234</p>
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
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Want to explore loans?{' '}
            <Link to="/products" className="font-semibold text-blue-600 hover:underline">
              View Loan Products
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
