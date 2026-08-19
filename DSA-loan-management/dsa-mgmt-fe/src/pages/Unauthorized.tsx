import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { ROUTES } from '../constants/routes'
import { LockOutlined, ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons'

interface UnauthorizedProps {
  requiredRole?: string
  currentRole?: string
}

const Unauthorized: React.FC<UnauthorizedProps> = ({ requiredRole, currentRole }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const activeRole = currentRole || user?.role

  const getDashboardPath = () => {
    if (activeRole === 'admin') return ROUTES.ADMIN.DASHBOARD
    if (activeRole === 'agent') return ROUTES.AGENT.LOAN_APPLICATIONS
    if (activeRole === 'customer') return ROUTES.CUSTOMER.PORTAL
    return ROUTES.HOME
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-200 text-amber-600 text-3xl">
          <LockOutlined />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('system.unauthorized.title')}</h1>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {t('system.unauthorized.subtitle')}
          {requiredRole && (
            <span className="block mt-2 font-medium text-slate-700">
              Required Role: <span className="capitalize text-blue-600 font-semibold">{requiredRole}</span>
              {activeRole && (
                <> (Your Role: <span className="capitalize text-slate-800 font-semibold">{activeRole}</span>)</>
              )}
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeftOutlined />
            {t('common.actions.back')}
          </button>

          <Link
            to={getDashboardPath()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
          >
            <HomeOutlined />
            {t('common.nav.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
