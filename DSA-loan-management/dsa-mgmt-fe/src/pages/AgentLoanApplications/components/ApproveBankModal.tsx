import React, { useState } from 'react'
import { LoanApplication } from '../../../services/loanApplications'

interface ApproveBankModalProps {
  application: LoanApplication | null
  banks: any[]
  onClose: () => void
  onApprove: (bankId: number, description: string) => Promise<void>
}

export const ApproveBankModal: React.FC<ApproveBankModalProps> = ({
  application,
  banks,
  onClose,
  onApprove,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<number | null>(
    banks[0]?.id || null
  )
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!application) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBankId) return
    setIsSubmitting(true)
    try {
      await onApprove(selectedBankId, description.trim())
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Approve & Forward to Bank</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Confirm loan approval for Application #{application.id} (
          <strong>{application.name}</strong>) and select the partner bank for disbursement processing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Lending Partner / Bank <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedBankId ?? ''}
              onChange={(e) => setSelectedBankId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Partner Bank --</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.isNationalize ? 'PSU' : b.isPrivate ? 'Private' : 'NBFC'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Approval Notes / Forwarding Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Recommended for 8.40% ROI based on CIBIL 780 and verified income"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedBankId}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing…' : 'Confirm & Forward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApproveBankModal
