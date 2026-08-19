import React, { useState } from 'react'
import { API_BASE_URL } from '../../../constants'

export type Agent = {
  id: number
  name: string
  email: string
  mobile: string
  tempPassword?: string
  tempPasswordReset: boolean
  isAdmin: boolean
  photo?: string
}

interface AgentFormModalProps {
  title: string
  initialData?: Agent | null
  onClose: () => void
  onSubmit: (formData: any) => Promise<void>
}

const inputCls =
  'w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 transition'

export const AgentFormModal: React.FC<AgentFormModalProps> = ({
  title,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [mobile, setMobile] = useState(initialData?.mobile || '')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(initialData?.isAdmin || false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(initialData?.photo || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        email,
        mobile,
        password: password || undefined,
        isAdmin,
        file: selectedFile,
        remove_photo: removePhoto,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className={inputCls}
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
              placeholder="e.g. ramesh@dsa.in"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mobile Number (10 Digits) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="9876543210"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {initialData ? 'Reset Password (Leave blank to keep current)' : 'Initial Password *'}
            </label>
            <input
              type="password"
              required={!initialData}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Grant Admin Rights</span>
          </label>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="text-xs"
            />
            {currentPhoto && (
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={`${API_BASE_URL}/static/agent-photos/${currentPhoto}`}
                  alt="preview"
                  className="h-9 w-9 rounded-full object-cover border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRemovePhoto(true)
                    setCurrentPhoto('')
                    setSelectedFile(null)
                  }}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Remove Photo
                </button>
              </div>
            )}
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
              {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgentFormModal
