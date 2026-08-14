import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { agentLogin, resetAgentPassword } from '../../services/auth'
import { message } from 'antd'

export default function AgentLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // First-time reset password state
  const [showResetModal, setShowResetModal] = useState(false)
  const [pendingAgent, setPendingAgent] = useState<{ id: number; name: string; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const auth = useAuth()
  const nav = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await agentLogin(email.trim(), password)
      const agent = res?.agent

      // Check if this is the agent's first time logging in (temppasswordreset === false)
      const isFirstLogin =
        agent?.temppasswordreset === false || agent?.tempPasswordReset === false

      if (isFirstLogin) {
        setPendingAgent({
          id: agent.id,
          name: agent.name || email,
          email: agent.email || email,
        })
        setShowResetModal(true)
        setLoading(false)
        return
      }

      // Normal login flow
      const name = agent?.name || email
      auth.login(name, 'agent', { id: agent.id, email: agent.email, photo: agent.photo })
      message.success(`Welcome back, ${name}!`)
      nav('/agent/customers')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)

    if (!newPassword.trim()) {
      setResetError('New password is required')
      return
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError('New password and confirm password do not match')
      return
    }

    if (!pendingAgent) return

    setResetLoading(true)
    try {
      await resetAgentPassword(pendingAgent.id, newPassword.trim())
      message.success('Password updated successfully! Please log in with your new password.')
      setShowResetModal(false)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPendingAgent(null)
    } catch (err: any) {
      setResetError(err?.response?.data?.detail || 'Failed to update password. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          {/* Top Logo / Icon */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-2xl font-black text-white shadow-md">
              A
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Agent Portal</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to manage customers and loan files</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition"
            >
              {loading ? 'Signing in…' : 'Sign In as Agent'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            <span>Customer? </span>
            <Link to="/customer-login" className="font-semibold text-blue-600 hover:underline">
              Customer Login
            </Link>
            <span className="mx-2">•</span>
            <span>Admin? </span>
            <Link to="/admin-login" className="font-semibold text-slate-700 hover:underline">
              Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* ── First-Time Login Password Reset Modal ────────────────────── */}
      {showResetModal && pendingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-xl font-bold">
                  🔐
                </span>
                <div>
                  <h3 className="text-lg font-bold">First-Time Login</h3>
                  <p className="text-xs text-amber-100">Set your personal permanent password</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                Welcome, <strong className="font-semibold">{pendingAgent.name}</strong>! You are currently using a temporary password. Please set a new permanent password to secure your account.
              </div>

              {resetError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    New Password
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false)
                      setPendingAgent(null)
                      setPassword('')
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50 transition"
                  >
                    {resetLoading ? 'Updating…' : 'Set Password & Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

