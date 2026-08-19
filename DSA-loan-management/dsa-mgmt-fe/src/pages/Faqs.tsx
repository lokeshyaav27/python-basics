import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../constants/routes'

const Faqs: React.FC = () => {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [search, setSearch] = useState('')

  const faqItems = (t('faqs.items', { returnObjects: true }) as Array<{ q: string; a: string }>) || []

  const filteredFaqs = faqItems.filter((f) => {
    return (
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
          💡 {t('faqs.tag')}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          {t('faqs.title')}
        </h1>
        <p className="mt-3 text-base text-slate-500">
          {t('faqs.subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.actions.search') + " FAQs..."}
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm shadow-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>

      {/* FAQs Accordion */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-blue-600 transition"
              >
                <span>{faq.q}</span>
                <span className="text-xl font-normal text-slate-400">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-3xl bg-blue-50 border border-blue-100 p-8 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Still have questions?</h3>
        <p className="text-sm text-slate-600 mb-6">Our dedicated loan officers are available to assist you.</p>
        <Link
          to={ROUTES.CONTACT_US}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          {t('common.nav.contact')}
        </Link>
      </div>
    </main>
  )
}

export default Faqs
