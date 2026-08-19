import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../constants/routes'

const AboutUs: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-8 py-14 text-white shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/20">
            🏢 {t('aboutUs.tag')}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('aboutUs.title')}
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            {t('aboutUs.subtitle')}
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700 mb-6">
            🎯
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('aboutUs.missionTitle')}</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            {t('aboutUs.missionDesc')}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700 mb-6">
            🌟
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('aboutUs.visionTitle')}</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            {t('aboutUs.visionDesc')}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mt-12 rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h3 className="text-2xl font-extrabold text-slate-900">{t('aboutUs.valuesTitle')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="rounded-2xl bg-slate-50 p-6">
            <span className="text-3xl mb-2 block">🤝</span>
            <h4 className="font-bold text-slate-800">{t('aboutUs.transparency')}</h4>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <span className="text-3xl mb-2 block">⚡</span>
            <h4 className="font-bold text-slate-800">{t('aboutUs.speed')}</h4>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <span className="text-3xl mb-2 block">💡</span>
            <h4 className="font-bold text-slate-800">{t('aboutUs.customerFirst')}</h4>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 text-center">
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

export default AboutUs
