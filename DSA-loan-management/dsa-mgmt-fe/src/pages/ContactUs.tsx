import React, { useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { submitContactEnquiry } from '../services/contact'

const ContactUs: React.FC = () => {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', loanType: 'Home Loan', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitContactEnquiry(form)
      message.success(t('contactUs.form.success'))
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
          📞 {t('contactUs.tag')}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          {t('contactUs.title')}
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
          {t('contactUs.subtitle')}
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
                Thank you, <span className="font-semibold text-slate-800">{form.name}</span>. An authorized DSA loan officer will contact you shortly.
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
              <h3 className="text-xl font-bold text-slate-900 mb-4">{t('contactUs.tag')}</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{t('contactUs.form.name')} *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('contactUs.form.namePlaceholder')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{t('contactUs.form.mobile')} *</label>
                  <input
                    required
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder={t('contactUs.form.mobilePlaceholder')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{t('contactUs.form.email')} *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t('contactUs.form.emailPlaceholder')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{t('contactUs.form.loanType')}</label>
                  <select
                    value={form.loanType}
                    onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="General Query">General Query</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{t('contactUs.form.message')}</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t('contactUs.form.messagePlaceholder')}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.99]"
              >
                {isSubmitting ? t('contactUs.form.submitting') : t('contactUs.form.submit')}
              </button>
            </form>
          )}
        </div>

        {/* Right Info Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-extrabold text-slate-900">{t('contactUs.info.office')}</h3>
            
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                📍
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Headquarters</div>
                <p className="mt-1 text-sm font-medium text-slate-800 leading-relaxed">
                  {t('contactUs.info.address')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                ☎️
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Helpline</div>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {t('contactUs.info.phone')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                ✉️
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">Email Support</div>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {t('contactUs.info.email')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ContactUs
