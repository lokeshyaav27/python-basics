import React, { useState } from 'react'
import { LoanApplication } from '../../../services/loanApplications'

interface RejectApplicationModalProps {
  application: LoanApplication | null
  onClose: () => void
  onReject: (description: string) => Promise<void>
}

export const RejectApplicationModal: React.FC<RejectApplicationModalProps> = ({
  application,
  onClose,
  onReject,
}) => {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!application) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setIsSubmitting(true)
    try {
      await onReject(description.trim())
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Reject Application</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Record rejection reason for Application #{application.id} (
          <strong>{application.name}</strong>). The customer will be informed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Rejection Reason / Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. CIBIL score below bank threshold (<650) or insufficient monthly income"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-rose-500"
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
              disabled={isSubmitting || !description.trim()}
              className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Recording…' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RejectApplicationModal
