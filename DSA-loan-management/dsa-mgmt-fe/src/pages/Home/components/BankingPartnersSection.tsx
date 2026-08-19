import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, API_BASE_URL } from '../../../constants'

interface BankingPartnersSectionProps {
  banks: any[]
}

export const BankingPartnersSection: React.FC<BankingPartnersSectionProps> = ({ banks }) => {
  const partnerBanks = banks.slice(0, 5)

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
            Institutional Tie-ups
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Our Banking Partners
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Top financial institutions offering verified rates and fast processing through our DSA network.
          </p>
        </div>

        <Link
          to={ROUTES.PARTNERS}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95 shrink-0"
        >
          See All Partners →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {partnerBanks.map((bank: any) => {
          const categoryTag = bank.isNationalize
            ? 'PSU Bank'
            : bank.isPrivate
            ? 'Private Bank'
            : bank.isNbfc
            ? 'NBFC'
            : 'Bank'

          return (
            <div
              key={bank.id}
              className="group rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs hover:border-blue-400 hover:shadow-xl transition duration-200 flex flex-col items-center justify-between"
            >
              <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-slate-50 p-3 mb-3 border border-slate-100 group-hover:bg-blue-50/50 transition">
                {bank.logo ? (
                  <img
                    src={`${API_BASE_URL}/static/bank-logo-images/${bank.logo}`}
                    alt={bank.name}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-3xl">🏦</span>
                )}
              </div>

              <div className="w-full">
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition">
                  {bank.name}
                </h4>
                <span className="inline-block mt-1 text-[11px] font-semibold text-slate-400">
                  {categoryTag}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BankingPartnersSection
