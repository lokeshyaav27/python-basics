import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchBanks } from '../../services/banks'
import { ROUTES } from '../../constants/routes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const Partners: React.FC = () => {
  const { t } = useTranslation()
  const { data: banks = [], isLoading } = useQuery({ queryKey: ['banks-all-partners'], queryFn: fetchBanks })
  const [filter, setFilter] = useState<'all' | 'nationalized' | 'private' | 'nbfc'>('all')

  const filteredBanks = banks.filter((b: any) => {
    if (filter === 'nationalized') return b.isNationalize
    if (filter === 'private') return b.isPrivate
    if (filter === 'nbfc') return b.isNbfc
    return true
  })

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
          🤝 {t('partners.tag')}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          {t('partners.title')}
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
          {t('partners.subtitle')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-10">
        {[
          { key: 'all', label: t('partners.filterAll') },
          { key: 'nationalized', label: t('partners.filterNationalized') },
          { key: 'private', label: t('partners.filterPrivate') },
          { key: 'nbfc', label: t('partners.filterNbfc') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">{t('common.actions.loading')}</div>
      ) : filteredBanks.length === 0 ? (
        <div className="py-20 text-center text-slate-400">{t('partners.noBanks')}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBanks.map((bank: any) => (
            <div
              key={bank.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  {bank.logo ? (
                    <img
                      src={`${API_BASE_URL}/${bank.logo}`}
                      alt={bank.name}
                      className="h-12 w-12 rounded-xl object-contain border border-slate-100 p-1"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-extrabold text-lg">
                      {bank.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{bank.name}</h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {bank.isNationalize ? 'Nationalized' : bank.isPrivate ? 'Private' : 'NBFC'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  to={ROUTES.APPLY_FOR_LOAN}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 py-2.5 text-xs font-bold text-slate-700 transition"
                >
                  {t('common.actions.apply')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default Partners
