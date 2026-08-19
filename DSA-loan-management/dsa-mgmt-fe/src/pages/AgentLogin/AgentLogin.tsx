import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { agentLogin, resetAgentPassword } from '../../services/auth'
import { ROUTES } from '../../constants/routes'

const AgentLogin: React.FC = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // First-time reset password state
  const [showResetModal, setShowResetModal] = useState(false)
  const [pendingAgent, setPendingAgent] = useState<{ id: number; name: string; email: string; token: string } | null>(null)
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
      const user = res?.user

      const isFirstLogin =
        user?.temppasswordreset === false || user?.tempPasswordReset === false

      if (isFirstLogin) {
        setPendingAgent({
          id: user.id,
          name: user.name || email,
          email: user.email || email,
          token: res?.accessToken || '',
        })
        setShowResetModal(true)
        setLoading(false)
        return
      }

      const name = user?.name || email
      auth.login(res.accessToken, {
        id: user.id,
        name,
        email: user.email || email,
        mobile: user.mobile,
        role: 'agent',
        photo: user.photo,
        isAdmin: false,
      })
      message.success(`Welcome back, ${name}!`)
      nav(ROUTES.AGENT.LOAN_APPLICATIONS)
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
      await resetAgentPassword(newPassword.trim(), pendingAgent.token)
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
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t('auth.agent.badge')}</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{t('auth.agent.title')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('auth.agent.subtitle')}</p>
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
                {t('auth.agent.emailLabel')}
              </label>
              <input
                required
                type="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('auth.agent.passwordLabel')}
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 transition active:scale-[0.99]"
            >
              {loading ? t('common.actions.loading') : t('auth.agent.loginBtn')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Not an agent?{' '}
              <Link to={ROUTES.CUSTOMER_LOGIN} className="font-semibold text-blue-600 hover:underline">
                {t('common.nav.customerPortal')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* First-time Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-2xl text-amber-700">
                🔑
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('auth.agent.resetRequiredTitle')}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {t('auth.agent.resetRequiredDesc')}
              </p>
            </div>

            {resetError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  {t('auth.agent.newPassword')}
                </label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
                  {t('auth.agent.confirmNewPassword')}
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t('common.actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {resetLoading ? t('common.actions.loading') : t('auth.agent.updatePasswordBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentLogin
