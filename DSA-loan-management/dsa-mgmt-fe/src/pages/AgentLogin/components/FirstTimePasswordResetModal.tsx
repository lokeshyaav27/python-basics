import React from 'react'

interface FirstTimePasswordResetModalProps {
  isOpen: boolean
  pendingAgent: { id: number; name: string; email: string; token: string } | null
  newPassword: string
  setNewPassword: (p: string) => void
  confirmPassword: string
  setConfirmPassword: (p: string) => void
  resetLoading: boolean
  resetError: string | null
  onSubmit: (e: React.FormEvent) => void
}

export const FirstTimePasswordResetModal: React.FC<FirstTimePasswordResetModalProps> = ({
  isOpen,
  pendingAgent,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  resetLoading,
  resetError,
  onSubmit,
}) => {
  if (!isOpen || !pendingAgent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-inner">
            🔐
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Set New Password</h3>
            <p className="text-xs text-slate-500">First-time login security requirement</p>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-xs text-amber-800 leading-relaxed">
          Hello <strong>{pendingAgent.name}</strong>, you are logging in with a temporary password.
          Please establish a permanent, secure password to continue.
        </div>

        {resetError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            ⚠️ {resetError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
          >
            {resetLoading ? 'Setting Password…' : 'Save & Activate Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default FirstTimePasswordResetModal
