import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { addLoanApplication } from '../../services/loanApplications'

export default function ApplyLoan() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', mobile: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (field: 'name' | 'email' | 'mobile', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await addLoanApplication(form)
      const customer = response?.customer || {}
      const customerName = customer.name || form.name

      login(customerName, 'customer')
      navigate('/customer')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to submit your details. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-950 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Start your journey</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight">Apply for a loan in minutes.</h1>
          <p className="mt-4 text-base text-blue-100">
            Share your details and we will connect you with the right lending partner based on your profile.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-blue-100">
            <li>• Quick eligibility review</li>
            <li>• Trusted lender matching</li>
            <li>• Support from our experts</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Apply now</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Get started</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Mobile number</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => onChange('mobile', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your mobile number"
              required
            />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting...' : 'Apply Now'}
          </button>
        </form>
      </div>
    </main>
  )
}
