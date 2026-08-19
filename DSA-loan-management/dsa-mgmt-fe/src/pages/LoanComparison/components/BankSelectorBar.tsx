import React from 'react'
import { Bank } from '../../../services/banks'
import { LoanApplication } from '../../../services/loanApplications'

interface BankSelectorBarProps {
  applications: LoanApplication[]
  selectedAppId: number | null
  onSelectApp: (id: number) => void
  allBanks: Bank[]
  bank1Id: number | null
  bank2Id: number | null
  setBank1Id: (id: number | null) => void
  setBank2Id: (id: number | null) => void
  onCompare: () => void
}

export const BankSelectorBar: React.FC<BankSelectorBarProps> = ({
  applications,
  selectedAppId,
  onSelectApp,
  allBanks,
  bank1Id,
  bank2Id,
  setBank1Id,
  setBank2Id,
  onCompare,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Application Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Select Loan Dossier / Application
          </label>
          <select
            value={selectedAppId ?? ''}
            onChange={(e) => onSelectApp(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-blue-500 font-medium"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                #{app.id} • {app.name || 'Applicant'} ({app.productName || 'Loan'})
              </option>
            ))}
          </select>
        </div>

        {/* Bank 1 Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Bank / Institution A
          </label>
          <select
            value={bank1Id ?? ''}
            onChange={(e) => setBank1Id(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-blue-500 font-medium"
          >
            <option value="">-- Choose First Bank --</option>
            {allBanks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bank 2 Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Bank / Institution B
          </label>
          <select
            value={bank2Id ?? ''}
            onChange={(e) => setBank2Id(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-blue-500 font-medium"
          >
            <option value="">-- Choose Second Bank --</option>
            {allBanks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onCompare}
          disabled={!bank1Id && !bank2Id}
          className="rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Compare Lending Terms →
        </button>
      </div>
    </div>
  )
}

export default BankSelectorBar
