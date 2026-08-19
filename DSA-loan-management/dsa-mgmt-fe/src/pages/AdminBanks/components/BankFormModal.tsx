import React, { useState } from 'react'
import { BankLogo } from './BankLogo'
import { API_BASE_URL } from '../../../constants'

export type Bank = {
  id: number
  name: string
  isNationalize: boolean
  isPrivate: boolean
  isnbfc: boolean
  logo?: string
}

interface BankFormModalProps {
  title: string
  initialData?: Bank | null
  onClose: () => void
  onSubmit: (data: {
    name: string
    isNationalize: boolean
    isPrivate: boolean
    isnbfc: boolean
    file: File | null
    remove_logo?: boolean
  }) => Promise<void>
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

export const BankFormModal: React.FC<BankFormModalProps> = ({
  title,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialData?.name || '')
  const [isNationalize, setIsNationalize] = useState(initialData?.isNationalize || false)
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false)
  const [isnbfc, setIsnbfc] = useState(initialData?.isnbfc || false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [currentLogo, setCurrentLogo] = useState(initialData?.logo || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        isNationalize,
        isPrivate,
        isnbfc,
        file: selectedFile,
        remove_logo: removeLogo,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bank / Institution Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="State Bank of India / HDFC Bank"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Institution Classification</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isNationalize}
                  onChange={(e) => setIsNationalize(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-700">Nationalized</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">Private</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isnbfc}
                  onChange={(e) => setIsnbfc(e.target.checked)}
                  className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-medium text-slate-700">NBFC</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bank Logo</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="text-sm"
                />
                <p className="mt-1 text-xs text-slate-400">Max 3 MB. Formats: PNG, JPG, SVG.</p>
              </div>
              {currentLogo && (
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <img
                    src={`${API_BASE_URL}/static/bank-logo-images/${currentLogo}`}
                    alt="current"
                    className="h-16 w-28 rounded-xl object-contain border p-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveLogo(true)
                      setCurrentLogo('')
                      setSelectedFile(null)
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BankFormModal
