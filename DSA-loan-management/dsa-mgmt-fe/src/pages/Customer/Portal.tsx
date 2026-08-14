import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCustomerLoanApplications } from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'

export default function CustomerPortal() {
  const { user } = useAuth()
  const customerIdentifier = user?.mobile || user?.email || user?.name || ''

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['customer-loans', customerIdentifier],
    queryFn: () => fetchCustomerLoanApplications(customerIdentifier),
  })

  const approved = loans.filter((l: any) => (l.status || '').toLowerCase() === 'approved').length
  const inProgress = loans.filter(
    (l: any) => !l.status || ((l.status || '').toLowerCase() !== 'approved' && (l.status || '').toLowerCase() !== 'rejected')
  ).length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Customer Dashboard
            </span>
            <h1 className="mt-3 text-3xl font-extrabold">Welcome, {user?.name || 'Customer'}!</h1>
            <p className="mt-1 text-sm text-blue-100 max-w-md">
              Manage your loan applications, review approval status, and connect with your financial advisors.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/customer/loans"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 shadow-md hover:bg-blue-50 transition"
            >
              View My Loans ({loans.length})
            </Link>
            <Link
              to="/apply-for-loan"
              className="rounded-xl bg-blue-500/30 border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              + Apply New Loan
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Applications</span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900">{loans.length}</div>
          <div className="mt-2 text-xs text-slate-400">Total submitted loan requests</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">Approved Loans</span>
            <span className="text-2xl">🎉</span>
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-700">{approved}</div>
          <div className="mt-2 text-xs text-emerald-600">Bank sanctions granted</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">In Verification</span>
            <span className="text-2xl">🔍</span>
          </div>
          <div className="mt-3 text-3xl font-bold text-blue-700">{inProgress}</div>
          <div className="mt-2 text-xs text-blue-600">Files being evaluated</div>
        </div>
      </div>
    </div>
  )
}
