import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchCustomerLoanApplications } from '../services/loanApplications'
import { useAuth } from '../auth/AuthProvider'
import { ROUTES } from '../constants/routes'

const CustomerPortal: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const customerIdentifier = user?.mobile || user?.email || user?.name || ''

  const { data: loans = [] } = useQuery({
    queryKey: ['customer-loans', customerIdentifier],
    queryFn: () => fetchCustomerLoanApplications(customerIdentifier),
  })

  const approved = loans.filter((l: any) => (l.status || '').toLowerCase() === 'approved').length
  const inProgress = loans.filter(
    (l: any) =>
      !l.status ||
      ((l.status || '').toLowerCase() !== 'approved' && (l.status || '').toLowerCase() !== 'rejected')
  ).length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              {t('customerPortal.badge')}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold">{t('customerPortal.welcome')}, {user?.name || 'Customer'}!</h1>
            <p className="mt-1 text-sm text-blue-100 max-w-md">
              {t('customerPortal.subtitle')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to={ROUTES.CUSTOMER.LOANS}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 shadow-md hover:bg-blue-50 transition"
            >
              {t('customerPortal.viewMyLoans')} ({loans.length})
            </Link>
            <Link
              to={ROUTES.APPLY_FOR_LOAN}
              className="rounded-xl bg-blue-500/30 border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              {t('customerPortal.applyNewLoan')}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{t('customerPortal.activeApps')}</span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{loans.length}</span>
            <span className="text-xs text-slate-500">{t('customerPortal.activeAppsDesc')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{t('customerPortal.approvedLoans')}</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{approved}</span>
            <span className="text-xs text-slate-500">{t('customerPortal.approvedLoansDesc')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{t('customerPortal.inVerification')}</span>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{inProgress}</span>
            <span className="text-xs text-slate-500">{t('customerPortal.inVerificationDesc')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerPortal
