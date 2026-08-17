import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBanks } from '../../services/banks'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function Partners() {
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
          🤝 Institutional Network
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Our Lending Partners
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
          Direct institutional tie-ups with India’s leading PSU banks, private banks, and NBFCs for priority loan processing.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-10">
        {[
          { key: 'all', label: 'All Partners' },
          { key: 'nationalized', label: 'Nationalized (PSU)' },
          { key: 'private', label: 'Private Banks' },
          { key: 'nbfc', label: 'NBFCs & HFCs' },
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
        <div className="py-20 text-center text-slate-400">Loading lending partners…</div>
      ) : filteredBanks.length === 0 ? (
        <div className="py-20 text-center text-slate-400">No banking partners found in this category.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBanks.map((bank: any) => {
            const categoryTag = bank.isNationalize
              ? 'Nationalized PSU Bank'
              : bank.isPrivate
              ? 'Private Sector Bank'
              : bank.isNbfc
              ? 'NBFC Institution'
              : 'Financial Institution'

            return (
              <div
                key={bank.id}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-xl hover:border-blue-300 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-24 items-center justify-center rounded-2xl bg-slate-50 p-4 mb-4 border border-slate-100 group-hover:bg-blue-50/50 transition">
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

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {bank.name}
                  </h3>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-slate-500">
                    {categoryTag}
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                  <span>Direct Integration</span>
                  <span>Fast Approvals ✓</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
