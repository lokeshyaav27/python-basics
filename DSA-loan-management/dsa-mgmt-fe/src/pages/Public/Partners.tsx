import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBanks } from '../../services/banks'

export default function Partners() {
  const { data: banks = [], isLoading } = useQuery({ queryKey: ['banks-all'], queryFn: fetchBanks })

  const fallbackBanks = [
    { id: 1, name: 'SBI', logo: '/logos/sbi.svg' },
    { id: 2, name: 'HDFC Bank', logo: '/logos/hdfc.svg' },
    { id: 3, name: 'ICICI Bank', logo: '/logos/icici.svg' },
    { id: 4, name: 'PNB', logo: '/logos/pnb.svg' },
    { id: 5, name: 'Axis Bank', logo: '/logos/bob.svg' },
    { id: 6, name: 'Kotak Mahindra', logo: '/logos/sbi.svg' },
    { id: 7, name: 'Yes Bank', logo: '/logos/hdfc.svg' },
    { id: 8, name: 'Bajaj Finance', logo: '/logos/icici.svg' },
  ]

  const displayBanks = banks.length > 0 ? banks : fallbackBanks

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Our partners</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Lending partners</h1>
        </div>
        <Link to="/" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
          ← Back to Home
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-600">Loading partners...</div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {displayBanks.map((bank: any) => (
            <div key={bank.id || bank.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50 p-4">
                <img src={bank.logo || '/logos/sbi.svg'} alt={bank.name} className="max-h-14 object-contain" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{bank.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {bank.isprivate ? 'Private sector bank' : bank.isnationalize ? 'Nationalized bank' : bank.isnbfc ? 'NBFC partner' : 'Financial partner'}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
