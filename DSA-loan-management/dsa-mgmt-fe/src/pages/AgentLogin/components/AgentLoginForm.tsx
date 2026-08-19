import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../constants'

interface AgentLoginFormProps {
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export const AgentLoginForm: React.FC<AgentLoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl shadow-inner mb-3">
          💼
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agent Portal Login</h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your assigned loan applications and underwriting workspace
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Agent Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="email"
            placeholder="agent@dsa.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Password <span className="text-rose-500">*</span>
          </label>
          <input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
        >
          {loading ? 'Authenticating…' : 'Log In to Agent Workspace →'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Looking for customer portal? </span>
        <Link to={ROUTES.CUSTOMER_LOGIN} className="font-bold text-blue-600 hover:underline">
          Customer Login
        </Link>
      </div>
    </div>
  )
}

export default AgentLoginForm
