import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { adminLogin } from '../services/auth'
import { ROUTES } from '../constants/routes'

const AdminLogin: React.FC = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await adminLogin(email.trim(), password)
      const user = res?.user || {}
      auth.login(res.accessToken, {
        id: user.id,
        name: user.name || email,
        email: user.email || email,
        mobile: user.mobile,
        role: 'admin',
        photo: user.photo,
        isAdmin: true,
      })
      nav(ROUTES.ADMIN.DASHBOARD)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid admin credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-2xl font-black text-white shadow-md">
              🛡️
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.admin.badge')}</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{t('auth.admin.title')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('auth.admin.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('auth.admin.emailLabel')}
              </label>
              <input
                required
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('auth.admin.passwordLabel')}
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition active:scale-[0.99]"
            >
              {loading ? t('common.actions.loading') : t('auth.admin.loginBtn')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Go back to{' '}
              <Link to={ROUTES.HOME} className="font-semibold text-blue-600 hover:underline">
                {t('common.nav.home')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
