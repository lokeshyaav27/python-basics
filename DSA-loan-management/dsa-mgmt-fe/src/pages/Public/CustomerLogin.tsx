import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { requestCustomerOtp, verifyCustomerOtp } from '../../services/auth'

export default function CustomerLogin() {
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const nav = useNavigate()

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await requestCustomerOtp(mobile)
      setOtpSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send OTP')
    }
  }

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await verifyCustomerOtp(mobile, otp)
      const name = res?.customer?.name || mobile
      auth.login(name, 'customer')
      nav('/customer')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'OTP verification failed')
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Customer Login</h2>
      {!otpSent ? (
        <form onSubmit={sendOtp} className="space-y-3">
          <input className="w-full p-2 border" placeholder="Mobile number" value={mobile} onChange={e=>setMobile(e.target.value)} />
          {error && <div className="text-red-600">{error}</div>}
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="space-y-3">
          <input className="w-full p-2 border" placeholder="Enter OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
          {error && <div className="text-red-600">{error}</div>}
          <button className="px-4 py-2 bg-green-600 text-white rounded" type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  )
}
