import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCustomerLoanApplications, LoanApplication } from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function StatusBadge({ status, bankName }: { status?: string | null; bankName?: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs">
        <span>⏳</span> Under Review
      </span>
    )
  }

  const s = status.toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-xs">
        <span>✅</span> Approved {bankName ? `(${bankName})` : ''}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-xs">
        <span>❌</span> Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
      <span>⏳</span> Under Review
    </span>
  )
}

export default function CustomerLoanList() {
  const { user } = useAuth()
  const customerIdentifier = user?.mobile || user?.email || user?.name || ''

  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Fetch loans specific to this customer (by mobile, email, or customer ID)
  const { data: loans = [], isLoading } = useQuery<LoanApplication[]>({
    queryKey: ['customer-loans', customerIdentifier],
    queryFn: () => fetchCustomerLoanApplications(customerIdentifier),
  })

  const totalCount = loans.length
  const approvedCount = loans.filter((l) => (l.status || '').toLowerCase() === 'approved').length
  const inReviewCount = loans.filter((l) => !l.status || ((l.status || '').toLowerCase() !== 'approved' && (l.status || '').toLowerCase() !== 'rejected')).length
  const rejectedCount = loans.filter((l) => (l.status || '').toLowerCase() === 'rejected').length

  function openDetails(loan: LoanApplication) {
    setSelectedLoan(loan)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200 border border-blue-400/20 mb-3">
              <span>📱</span> Mobile: {customerIdentifier || 'Registered Customer'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              My Loan Applications
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
              Track real-time progress, approval sanctions, and bank updates for all your submitted loan applications.
            </p>
          </div>

          <Link
            to="/apply-for-loan"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
          >
            <span>+</span> Apply for New Loan
          </Link>
        </div>

        {/* Quick Stat Counters */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 p-3.5 backdrop-blur-sm border border-white/5">
            <div className="text-xs font-medium text-slate-400">Total Applications</div>
            <div className="mt-1 text-2xl font-bold text-white">{totalCount}</div>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3.5 backdrop-blur-sm border border-emerald-500/20">
            <div className="text-xs font-medium text-emerald-300">Approved Loans</div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">{approvedCount}</div>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-3.5 backdrop-blur-sm border border-blue-500/20">
            <div className="text-xs font-medium text-blue-300">Under Review</div>
            <div className="mt-1 text-2xl font-bold text-blue-400">{inReviewCount}</div>
          </div>
          <div className="rounded-2xl bg-rose-500/10 p-3.5 backdrop-blur-sm border border-rose-500/20">
            <div className="text-xs font-medium text-rose-300">Rejected</div>
            <div className="mt-1 text-2xl font-bold text-rose-400">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* ── Applications Section ────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Application History</h2>
          <span className="text-xs text-slate-500">Showing {loans.length} record(s)</span>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            Loading your loan applications…
          </div>
        ) : loans.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              📄
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">No loan applications found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              We couldn't find any loan files submitted under identifier{' '}
              <span className="font-semibold text-slate-700">{customerIdentifier}</span>.
            </p>
            <div className="mt-6">
              <Link
                to="/apply-for-loan"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Start Loan Application
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition hover:border-blue-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Product & Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {loan.productImage ? (
                        <img
                          src={`${API_BASE_URL}/static/product-images/${loan.productImage}`}
                          alt={loan.productName || 'Product'}
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-slate-50 p-1"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-600 border border-blue-100">
                          💳
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {loan.productName || 'Loan Application'}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          App ID: #{loan.id} • {loan.uniqueCustomerId || loan.mobile}
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={loan.status} bankName={loan.bankName} />
                  </div>

                  {/* Highlight Box if Approved or Rejected */}
                  {loan.status.toLowerCase() === 'approved' && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 mb-4">
                      <div className="flex items-center gap-2.5">
                        {loan.bankLogo ? (
                          <img
                            src={`${API_BASE_URL}/static/bank-logo-images/${loan.bankLogo}`}
                            alt={loan.bankName || 'Bank'}
                            className="h-7 w-7 rounded object-contain bg-white border p-0.5"
                          />
                        ) : (
                          <span className="text-lg">🏦</span>
                        )}
                        <div>
                          <div className="text-xs font-bold text-emerald-900">
                            Sanctioned by {loan.bankName || 'Partner Bank'}
                          </div>
                          {loan.description && (
                            <p className="text-xs text-emerald-700 mt-0.5">{loan.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {loan.status.toLowerCase() === 'rejected' && loan.description && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 mb-4">
                      <div className="text-xs font-bold text-rose-900 mb-0.5">Decision Remarks:</div>
                      <p className="text-xs text-rose-700">{loan.description}</p>
                    </div>
                  )}

                  {/* Key Info Details Grid */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Applicant Name</span>
                      <span className="font-semibold text-slate-700">{loan.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email Address</span>
                      <span className="font-semibold text-slate-700 truncate block">{loan.email}</span>
                    </div>
                  </div>

                  {/* Assigned Agent Contact Banner */}
                  {loan.agentName && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                      <div className="flex items-center gap-2">
                        {loan.agentPhoto ? (
                          <img
                            src={`${API_BASE_URL}/static/agent-photos/${loan.agentPhoto}`}
                            alt={loan.agentName}
                            className="h-7 w-7 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            {loan.agentName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-[11px] text-slate-400">Assigned Advisor</div>
                          <div className="text-xs font-bold text-slate-800">{loan.agentName}</div>
                        </div>
                      </div>
                      {loan.agentMobile && (
                        <a
                          href={`tel:${loan.agentMobile}`}
                          className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 border border-slate-200 hover:bg-blue-50 transition shadow-2xs"
                        >
                          📞 Call Advisor
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Status: <span className="capitalize font-medium text-slate-600">{loan.status}</span>
                  </span>
                  <button
                    onClick={() => openDetails(loan)}
                    className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition border border-blue-200 shadow-2xs"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detailed Modal ──────────────────────────────────────────────── */}
      {showDetailModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedLoan.productName || 'Loan Application'} Details
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Application Reference #{selectedLoan.id}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Status Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Current Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedLoan.status} bankName={selectedLoan.bankName} />
                  </div>
                </div>
                {selectedLoan.bankName && (
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Lending Bank</span>
                    <div className="text-sm font-bold text-slate-800 mt-1">{selectedLoan.bankName}</div>
                  </div>
                )}
              </div>

              {/* Applicant Info */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Applicant Information
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Full Name</span>
                    <span className="font-semibold text-slate-800">{selectedLoan.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Mobile Number</span>
                    <span className="font-semibold text-slate-800">{selectedLoan.mobile}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedLoan.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Customer ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {selectedLoan.uniqueCustomerId || selectedLoan.mobile}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Sanction / Remarks */}
              {selectedLoan.description && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                    {selectedLoan.status.toLowerCase() === 'approved'
                      ? 'Sanction Notes & Terms'
                      : 'Application Remarks'}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLoan.description}</p>
                </div>
              )}

              {/* Assigned Agent Card */}
              {selectedLoan.agentName && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-blue-800 mb-2">
                    Dedicated Loan Advisor
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedLoan.agentPhoto ? (
                      <img
                        src={`${API_BASE_URL}/static/agent-photos/${selectedLoan.agentPhoto}`}
                        alt={selectedLoan.agentName}
                        className="h-10 w-10 rounded-full object-cover border border-blue-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {selectedLoan.agentName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">{selectedLoan.agentName}</div>
                      <div className="text-xs text-slate-500">
                        {selectedLoan.agentEmail && `${selectedLoan.agentEmail} • `}
                        {selectedLoan.agentMobile && selectedLoan.agentMobile}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-100 px-6 py-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
