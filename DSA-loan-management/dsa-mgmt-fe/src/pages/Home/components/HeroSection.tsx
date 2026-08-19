import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../../constants'

export const HeroSection: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white pt-12 pb-24 lg:pt-20 lg:pb-32">
      {/* Glow ambient backgrounds */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('home.badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
              {t('home.heroTitle')}
            </h1>

            <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {t('home.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to={ROUTES.APPLY_FOR_LOAN}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-7 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/30 hover:bg-blue-400 transition active:scale-95"
              >
                <span>⚡ {t('home.ctaApply')}</span>
              </Link>
              <Link
                to={ROUTES.CUSTOMER_LOGIN}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition"
              >
                {t('common.nav.customerPortal')}
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-base">✓</span>
                <span>100% Free Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-base">✓</span>
                <span>No Upfront Hidden Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-base">✓</span>
                <span>End-to-End DSA Support</span>
              </div>
            </div>
          </div>

          {/* Right Card / Visual Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
                    🏆
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Premier Lending Partner</h4>
                    <p className="text-[11px] text-blue-200">Verified Banks & Direct Integration</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 font-bold">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
                  <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Home Loans</span>
                  <span className="text-lg font-extrabold text-white">From 8.35%</span>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
                  <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Personal Loans</span>
                  <span className="text-lg font-extrabold text-white">From 10.49%</span>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-blue-100 block">Typical Disbursal Time</span>
                  <span className="text-sm font-extrabold text-white">24 - 48 Hours</span>
                </div>
                <Link
                  to={ROUTES.PRODUCTS}
                  className="rounded-lg bg-white px-3 py-1.5 font-bold text-blue-900 hover:bg-blue-50 transition"
                >
                  View Rates →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
