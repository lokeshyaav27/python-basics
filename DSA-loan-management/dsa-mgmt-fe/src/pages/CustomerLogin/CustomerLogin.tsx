import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthProvider'
import { requestCustomerOtp, verifyCustomerOtp } from '../../services/auth'
import { ROUTES } from '../../constants/routes'
import { CustomerMobileForm, CustomerOtpForm } from './components'

const CustomerLogin: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    const m = searchParams.get('mobile')
    if (m) {
      setMobile(m.trim())
    }
  }, [searchParams])

  const requestOtpMutation = useMutation({
    mutationFn: (phone: string) => requestCustomerOtp(phone),
    onSuccess: () => {
      setOtpSent(true)
      message.success('OTP sent successfully! (Demo OTP: 1234)')
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Failed to send OTP')
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      verifyCustomerOtp(phone, code),
    onSuccess: (res) => {
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
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'OTP verification failed')
    },
  })

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!mobile.trim()) {
      setError('Please enter your mobile number')
      return
    }
    requestOtpMutation.mutate(mobile.trim())
  }

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!otp.trim()) {
      setError('Please enter the OTP received')
      return
    }
    verifyOtpMutation.mutate({ phone: mobile.trim(), code: otp.trim() })
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
          <CustomerMobileForm
            mobile={mobile}
            setMobile={setMobile}
            error={error}
            isLoading={requestOtpMutation.isPending}
            onSubmit={sendOtp}
          />
        ) : (
          <CustomerOtpForm
            otp={otp}
            setOtp={setOtp}
            error={error}
            isLoading={verifyOtpMutation.isPending}
            onBack={() => setOtpSent(false)}
            onSubmit={submitOtp}
            onResend={() => requestOtpMutation.mutate(mobile.trim())}
          />
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            {t('auth.customer.newCustomer')}{' '}
            <Link to={ROUTES.APPLY_FOR_LOAN} className="font-bold text-blue-600 hover:underline">
              {t('auth.customer.applyNow')}
            </Link>
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs font-semibold text-blue-600">
            <Link to={ROUTES.AGENT_LOGIN} className="hover:underline">
              Agent Login
            </Link>
            <span>•</span>
            <Link to={ROUTES.ADMIN_LOGIN} className="hover:underline">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin
