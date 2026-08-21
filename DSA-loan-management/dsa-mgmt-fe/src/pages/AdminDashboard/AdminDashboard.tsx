import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          {t('adminDashboard.badge')}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">{t('adminDashboard.title')}</h1>
        <p className="mt-1 text-sm text-blue-200 max-w-lg">
          {t('adminDashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={ROUTES.ADMIN.PRODUCTS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">🏷️</div>
          <div className="text-base font-bold text-slate-900">{t('adminDashboard.cards.productsTitle')}</div>
          <div className="text-xs text-slate-500 mt-1">{t('adminDashboard.cards.productsDesc')}</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.BANKS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">🏦</div>
          <div className="text-base font-bold text-slate-900">{t('adminDashboard.cards.banksTitle')}</div>
          <div className="text-xs text-slate-500 mt-1">{t('adminDashboard.cards.banksDesc')}</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.AGENTS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="text-base font-bold text-slate-900">{t('adminDashboard.cards.agentsTitle')}</div>
          <div className="text-xs text-slate-500 mt-1">{t('adminDashboard.cards.agentsDesc')}</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.LOAN_APPLICATIONS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="text-base font-bold text-slate-900">{t('adminDashboard.cards.loansTitle')}</div>
          <div className="text-xs text-slate-500 mt-1">{t('adminDashboard.cards.loansDesc')}</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.CHAT_WITH_AI}
          className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/30 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition block sm:col-span-2 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl p-3 bg-purple-100 rounded-2xl">🤖</div>
              <div>
                <div className="text-base font-bold text-purple-950 flex items-center gap-2">
                  {t('common.nav.aiAssistant')}
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                    Admin AI Copilot
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Interactive AI underwriter with access to bank policy RAG search and portfolio dossiers.
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to={ROUTES.ADMIN.AI_ISSUES}
          className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/30 p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition block sm:col-span-2 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl p-3 bg-rose-100 rounded-2xl">🚩</div>
              <div>
                <div className="text-base font-bold text-rose-950 flex items-center gap-2">
                  AI Quality & Issue Reports
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                    Quality Assurance
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Audit flagged AI responses, review root-cause analysis, and track remediation.
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
