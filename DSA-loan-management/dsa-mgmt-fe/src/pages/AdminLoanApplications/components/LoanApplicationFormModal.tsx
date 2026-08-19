import React, { useState } from 'react'
import { LoanApplication } from '../../../services/loanApplications'

interface LoanApplicationFormModalProps {
  title: string
  initialData?: LoanApplication | null
  products: any[]
  onClose: () => void
  onSubmit: (data: {
    name: string
    email: string
    mobile: string
    productId: number | null
  }) => Promise<void>
}

export const LoanApplicationFormModal: React.FC<LoanApplicationFormModalProps> = ({
  title,
  initialData,
  products,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [mobile, setMobile] = useState(initialData?.mobile || '')
  const [productId, setProductId] = useState<number | null>(
    initialData?.productId ?? (products[0]?.id || null)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, email, mobile, productId })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Applicant Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amit Kumar"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. amit@example.com"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Loan Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={productId ?? ''}
              onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white outline-none focus:border-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoanApplicationFormModal
