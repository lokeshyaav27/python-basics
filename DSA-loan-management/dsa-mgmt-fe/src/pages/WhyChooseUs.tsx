import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../constants/routes'

const WhyChooseUs: React.FC = () => {
  const { t } = useTranslation()

  const comparisonData = [
    { feature: 'Bank Comparison', dsa: '50+ Banks & NBFCs in 1 Click', direct: 'Must visit each bank individually' },
    { feature: 'Interest Rate Negotiation', dsa: 'Corporate bulk volume discount', direct: 'Standard rack interest rates' },
    { feature: 'Doorstep / Digital Process', dsa: '100% Digital with home pickup', direct: 'Multiple physical branch queues' },
    { feature: 'CIBIL Impact on Inquiries', dsa: 'Single soft pre-qualification', direct: 'Hard inquiries per application' },
    { feature: 'Turnaround Time', dsa: '24 - 48 Hours', direct: '15 - 30 Working Days' },
    { feature: 'Consultation Fee', dsa: 'Free (₹0)', direct: 'Branch processing charges apply' },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 px-8 py-14 text-white shadow-2xl text-center md:text-left relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 border border-white/15">
            🏆 {t('whyChooseUs.tag')}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('whyChooseUs.title')}
          </h1>
          <p className="text-base text-blue-100/80 leading-relaxed max-w-2xl">
            {t('whyChooseUs.subtitle')}
          </p>
        </div>
      </section>

      {/* 4 Key Pillars */}
      <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-lg transition">
          <span className="text-3xl mb-3 block">⚡</span>
          <h3 className="text-lg font-bold text-slate-900">{t('whyChooseUs.cards.comparison')}</h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
            {t('whyChooseUs.cards.comparisonDesc')}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-lg transition">
          <span className="text-3xl mb-3 block">🤖</span>
          <h3 className="text-lg font-bold text-slate-900">{t('whyChooseUs.cards.aiEngine')}</h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
            {t('whyChooseUs.cards.aiEngineDesc')}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-lg transition">
          <span className="text-3xl mb-3 block">👨‍💼</span>
          <h3 className="text-lg font-bold text-slate-900">{t('whyChooseUs.cards.doorstep')}</h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
            {t('whyChooseUs.cards.doorstepDesc')}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-lg transition">
          <span className="text-3xl mb-3 block">🔒</span>
          <h3 className="text-lg font-bold text-slate-900">{t('whyChooseUs.cards.transparent')}</h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
            {t('whyChooseUs.cards.transparentDesc')}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm overflow-x-auto">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-6">DSA Finance vs Direct Bank Visits</h3>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 font-bold text-slate-700">Feature</th>
              <th className="py-3 px-4 font-bold text-blue-700 bg-blue-50/50 rounded-t-lg">DSA Finance</th>
              <th className="py-3 px-4 font-bold text-slate-500">Direct Bank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparisonData.map((row, i) => (
              <tr key={i}>
                <td className="py-3.5 px-4 font-medium text-slate-800">{row.feature}</td>
                <td className="py-3.5 px-4 font-bold text-blue-700 bg-blue-50/30">✓ {row.dsa}</td>
                <td className="py-3.5 px-4 text-slate-500">{row.direct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* CTA */}
      <section className="mt-14 text-center">
        <Link
          to={ROUTES.APPLY_FOR_LOAN}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-blue-700 transition"
        >
          {t('common.nav.applyNow')} →
        </Link>
      </section>
    </main>
  )
}

export default WhyChooseUs
