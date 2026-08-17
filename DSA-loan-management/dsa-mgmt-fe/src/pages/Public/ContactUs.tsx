import React, { useState } from 'react'
import { message } from 'antd'
import { submitContactEnquiry } from '../../services/contact'

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', loanType: 'Home Loan', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitContactEnquiry(form)
      message.success('Thank you! Your enquiry has been received. A loan advisor will contact you within 2 hours.')
      setSubmitted(true)
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to submit enquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
          📞 24/7 Dedicated Support
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Speak to a Loan Advisor
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
          Have questions regarding interest rates, eligibility, or loan approvals? Reach out and our specialists will guide you.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Enquiry Received!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Thank you, <span className="font-semibold text-slate-800">{form.name}</span>. An authorized DSA loan officer will call you at <span className="font-semibold text-slate-800">{form.mobile}</span> shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setForm({ name: '', email: '', mobile: '', loanType: 'Home Loan', message: '' })
                }}
                className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Request a Free Call-Back</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Priya Nair"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="priya.nair@example.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Loan Interest</label>
                  <select
                    value={form.loanType}
                    onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Business Loan">Business Working Capital</option>
                    <option value="General Query">General Query</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Your Message / Query</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about the loan amount required, your city, or specific questions..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Enquiry…' : 'Submit Consultation Request →'}
              </button>
            </form>
          )}
        </div>

        {/* Right Info Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700">
              ☎️
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Toll-Free Helpline</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">1800-123-4567</p>
              <p className="text-xs text-slate-500 mt-1">Mon - Sat, 9:00 AM - 7:00 PM</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
              ✉️
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Support Email</span>
              <p className="text-base font-extrabold text-slate-900 mt-1">support@dsafinance.com</p>
              <p className="text-xs text-slate-500 mt-1">Average response time: Under 2 hours</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700">
              📍
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Corporate Headquarters</span>
              <p className="text-base font-extrabold text-slate-900 mt-1">DSA Finance Hub</p>
              <p className="text-xs text-slate-500 mt-1">Level 5, Financial District, New Delhi - 110001, India</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
