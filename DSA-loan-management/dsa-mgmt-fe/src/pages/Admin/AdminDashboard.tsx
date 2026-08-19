import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          Admin Portal
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">Executive Admin Dashboard</h1>
        <p className="mt-1 text-sm text-blue-200 max-w-lg">
          Configure loan products, manage partner banks, monitor DSA agents, and oversee loan applications.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={ROUTES.ADMIN.PRODUCTS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">🏷️</div>
          <div className="text-base font-bold text-slate-900">Manage Products</div>
          <div className="text-xs text-slate-500 mt-1">Configure loan types and criteria</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.BANKS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">🏦</div>
          <div className="text-base font-bold text-slate-900">Manage Banks</div>
          <div className="text-xs text-slate-500 mt-1">Institutions & policy documents</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.AGENTS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="text-base font-bold text-slate-900">Manage Agents</div>
          <div className="text-xs text-slate-500 mt-1">DSA loan advisors & credentials</div>
        </Link>

        <Link
          to={ROUTES.ADMIN.LOAN_APPLICATIONS}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition block"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="text-base font-bold text-slate-900">Loan Applications</div>
          <div className="text-xs text-slate-500 mt-1">Review borrower submissions</div>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
