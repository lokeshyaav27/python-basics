import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { InfoCircleOutlined, SendOutlined, WarningOutlined } from '@ant-design/icons'
import { LoanApplication } from '../../../services/loanApplications'
import { fetchBanks, Bank } from '../../../services/banks'

interface ApproveBankModalProps {
  application: LoanApplication | null
  banks?: Bank[]
  onClose: () => void
  onApprove: (bankId: number, description: string) => Promise<void>
}

export const ApproveBankModal: React.FC<ApproveBankModalProps> = ({
  application,
  banks: fallbackBanks = [],
  onClose,
  onApprove,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const productId = application?.productId ?? (application?.product?.id || null)

  const { data: productBanks = [], isLoading: isLoadingBanks } = useQuery<Bank[]>({
    queryKey: ['banks-for-product', productId],
    queryFn: () => fetchBanks({ product_id: productId! }),
    enabled: !!productId,
  })

  // Use product-specific banks if available, else fallback
  const availableBanks = productId ? productBanks : fallbackBanks

  useEffect(() => {
    if (availableBanks.length > 0) {
      setSelectedBankId(availableBanks[0].id)
    } else {
      setSelectedBankId(null)
    }
  }, [availableBanks])

  if (!application) return null

  const rawProductName =
    application.product_name ||
    application.product?.name ||
    (application.productId === 1
      ? 'Home Loan'
      : application.productId === 2
      ? 'Car Loan'
      : application.productId === 3
      ? 'Personal Loan'
      : 'Loan')

  const displayProductName = rawProductName.toLowerCase().includes('loan')
    ? rawProductName
    : `${rawProductName} Loan`

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📤</span>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Forward {displayProductName} Application to Partner Bank
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Application #{application.id} • {application.name} ({displayProductName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Informational Guidance Alert */}
        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-3.5 mb-5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
          <InfoCircleOutlined className="text-blue-600 text-sm mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-950">Eligibility Confirmation & Bank Submission</p>
            <p className="text-blue-800/90 mt-0.5">
              Forwarding this application confirms that the applicant meets initial eligibility and document requirements.
              Final loan sanction, approval terms, and disbursement remain subject to the partner bank's underwriting decision.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Lending Partner / Bank offering {displayProductName} <span className="text-rose-500">*</span>
            </label>

            {isLoadingBanks ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border">
                Filtering partner banks for {displayProductName}…
              </div>
            ) : availableBanks.length === 0 ? (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <WarningOutlined className="text-amber-600 text-sm mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">No Partner Banks Available</p>
                  <p className="text-amber-800 mt-0.5">
                    No active partner banks are currently linked to offer <strong>{displayProductName}</strong>. Please link partner banks in Admin Banks first.
                  </p>
                </div>
              </div>
            ) : (
              <select
                required
                value={selectedBankId ?? ''}
                onChange={(e) => setSelectedBankId(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-300 p-3 text-xs bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition font-medium text-slate-800"
              >
                <option value="">-- Choose Partner Bank ({availableBanks.length} Available) --</option>
                {availableBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.isNationalize ? 'PSU' : b.isPrivate ? 'Private' : 'NBFC'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Advisor Recommendation / Forwarding Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Applicant meets FOIR & LTV criteria; recommended for processing based on credit evaluation."
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedBankId || availableBanks.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-md cursor-pointer"
            >
              <SendOutlined />
              {isSubmitting ? 'Processing…' : 'Confirm & Forward to Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApproveBankModal
