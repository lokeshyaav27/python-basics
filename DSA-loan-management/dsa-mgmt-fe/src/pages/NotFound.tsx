import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../constants/routes'

const NotFound: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="p-8 max-w-lg mx-auto text-center my-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-3xl font-extrabold text-slate-900">{t('system.notFound.title')}</h2>
      <p className="mt-2 text-slate-600">{t('system.notFound.subtitle')}</p>
      <div className="mt-6">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
        >
          {t('system.notFound.backHome')}
        </Link>
      </div>
    </div>
  )
}

export default NotFound
