import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchLoanApplications,
  updateLoanApplicationStatus,
  LoanApplication,
} from '../../services/loanApplications'
import { fetchBanks } from '../../services/banks'
import { useAuth } from '../../auth/AuthProvider'
import { message } from 'antd'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }
  const initial = name ? name.charAt(0).toUpperCase() : 'L'
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
    >
      {initial}
    </div>
  )
}

function StatusBadge({ status, bankName }: { status: string; bankName?: string | null }) {
  switch (status.toLowerCase()) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span>✅</span> Approved {bankName ? `(${bankName})` : ''}
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
          <span>❌</span> Rejected
        </span>
      )
    case 'inprogress':
    case 'in-progress':
      return (
        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          In Progress
        </span>
      )
    case 'not-started':
      return (
        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          Not Started
        </span>
      )
    default:
      return (
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {status}
        </span>
      )
  }
}

export default function AgentLoanApplicationsPage() {
  const qc = useQueryClient()
  const { user } = useAuth()

  const [activeApplication, setActiveApplication] = useState<LoanApplication | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [approveModal, setApproveModal] = useState<{ open: boolean; application: LoanApplication | null }>({
    open: false,
    application: null,
  })
  const [rejectModal, setRejectModal] = useState<{ open: boolean; application: LoanApplication | null }>({
    open: false,
    application: null,
  })

  // State for Approve Modal
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [approveRemarks, setApproveRemarks] = useState('')

  // State for Reject Modal
  const [rejectReason, setRejectReason] = useState('')

  // Fetch only applications assigned to the logged-in agent
  const { data: applications = [], isLoading, refetch } = useQuery<LoanApplication[]>({
    queryKey: ['agent-loan-applications', user?.id],
    queryFn: () => fetchLoanApplications(user?.id),
    enabled: true,
  })

  // Fetch active banks for approval dropdown
  const { data: banks = [] } = useQuery({
    queryKey: ['banks-list'],
    queryFn: fetchBanks,
  })

  // Mutation for status update
  const statusMutation = useMutation({
    mutationFn: ({
      applicationId,
      payload,
    }: {
      applicationId: number
      payload: { status: string; bankId?: number | null; description?: string | null }
    }) => updateLoanApplicationStatus(applicationId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agent-loan-applications', user?.id] })
      refetch()
      if (variables.payload.status === 'approved') {
        message.success('Application approved successfully!')
      } else {
        message.success('Application marked as rejected.')
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update application status')
    },
  })

  function openView(c: LoanApplication) {
    setActiveApplication(c)
    setShowViewModal(true)
  }

  function openApprove(c: LoanApplication) {
    setSelectedBankId(c.bankId || (banks.length > 0 ? banks[0].id : null))
    setApproveRemarks(c.description || '')
    setApproveModal({ open: true, application: c })
  }

  function openReject(c: LoanApplication) {
    setRejectReason(c.status === 'rejected' ? c.description || '' : '')
    setRejectModal({ open: true, application: c })
  }

  async function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approveModal.application) return
    if (!selectedBankId) {
      message.error('Please select an approving bank')
      return
    }

    await statusMutation.mutateAsync({
      applicationId: approveModal.application.id,
      payload: {
        status: 'approved',
        bankId: selectedBankId,
        description: approveRemarks.trim() || undefined,
      },
    })
    setApproveModal({ open: false, application: null })
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectModal.application) return
    if (!rejectReason.trim()) {
      message.error('Please provide a reason for rejection')
      return
    }

    await statusMutation.mutateAsync({
      applicationId: rejectModal.application.id,
      payload: {
        status: 'rejected',
        bankId: null,
        description: rejectReason.trim(),
      },
    })
    setRejectModal({ open: false, application: null })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Assigned Loan Applications</h2>
          <p className="text-sm text-slate-500">
            Manage customer loan applications, evaluate status, and record bank approvals or rejections
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs font-semibold text-blue-700">
          Total Assigned: {applications.length}
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  Loading your assigned loan applications…
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  <div className="mx-auto max-w-sm text-center">
                    <span className="text-3xl">📂</span>
                    <div className="mt-2 font-medium text-slate-600">No applications assigned yet</div>
                    <p className="mt-1 text-xs text-slate-400">
                      When the admin assigns loan applications to you, they will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              applications.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div>
                        <span className="block text-sm font-semibold text-slate-800">{c.name}</span>
                        {c.uniqueCustomerId && (
                          <span className="block text-[11px] text-slate-400 font-mono">ID: {c.uniqueCustomerId}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-600">{c.email}</td>
                  <td className="p-3 text-sm text-slate-600">{c.mobile}</td>
                  <td className="p-3">
                    <StatusBadge status={c.status} bankName={c.bankName} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {/* Approve Button */}
                      <button
                        onClick={() => openApprove(c)}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-sm flex items-center gap-1"
                        title="Approve loan application"
                      >
                        <span>✅</span> Approve
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => openReject(c)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition shadow-sm flex items-center gap-1"
                        title="Reject loan application"
                      >
                        <span>❌</span> Reject
                      </button>

                      {/* View Details Button */}
                      <button
                        onClick={() => openView(c)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition shadow-sm"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Approve Modal ───────────────────────────────────────────────── */}
      {approveModal.open && approveModal.application && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <h3 className="text-lg font-bold text-slate-800">Approve Loan Application</h3>
              </div>
              <button
                onClick={() => setApproveModal({ open: false, application: null })}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              {/* Applicant Info Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center gap-3">
                <Avatar name={approveModal.application.name} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800">{approveModal.application.name}</div>
                  <div className="text-xs text-slate-500">{approveModal.application.email} • {approveModal.application.mobile}</div>
                </div>
              </div>

              {/* Select Bank */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select Approving Bank / Partner <span className="text-red-500">*</span>
                </label>
                {banks.length === 0 ? (
                  <div className="text-xs text-slate-400">No active banks found in system.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {banks.map((b: any) => {
                      const isSelected = selectedBankId === b.id
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBankId(b.id)}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {b.logo ? (
                            <img
                              src={`${API_BASE_URL}/static/bank-logo-images/${b.logo}`}
                              alt={b.name}
                              className="h-8 w-8 object-contain rounded border bg-white p-0.5"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {b.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-800">{b.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {b.isNationalize ? 'Nationalized' : b.isPrivate ? 'Private' : b.isnbfc ? 'NBFC' : 'Partner Bank'}
                            </div>
                          </div>
                          {isSelected && <span className="text-emerald-600 font-bold text-sm">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Approval Remarks / Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Approval Notes / Sanction Details (optional)
                </label>
                <textarea
                  rows={3}
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  placeholder="e.g. Sanctioned ₹25,00,000 at 8.50% ROI. Reference No: HDFC-2026-9812"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApproveModal({ open: false, application: null })}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                >
                  {statusMutation.isPending ? 'Approving…' : 'Confirm & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject Modal ────────────────────────────────────────────────── */}
      {rejectModal.open && rejectModal.application && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-rose-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <h3 className="text-lg font-bold text-slate-800">Reject Loan Application</h3>
              </div>
              <button
                onClick={() => setRejectModal({ open: false, application: null })}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              {/* Applicant Info Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center gap-3">
                <Avatar name={rejectModal.application.name} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800">{rejectModal.application.name}</div>
                  <div className="text-xs text-slate-500">{rejectModal.application.email} • {rejectModal.application.mobile}</div>
                </div>
              </div>

              {/* Rejection Reason Textarea */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rejection Reason / Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. CIBIL score is below eligibility threshold (620). High Debt-to-Income ratio."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition resize-none"
                />
                <p className="mt-1 text-xs text-slate-400">Please provide clear remarks for customer records and internal audit.</p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, application: null })}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
                >
                  {statusMutation.isPending ? 'Rejecting…' : 'Confirm & Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Customer Modal ────────────────────────────────────────── */}
      {showViewModal && activeApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Application Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Profile Overview Card */}
              <div className="flex flex-col items-center gap-2.5 pb-4 border-b border-slate-100 text-center">
                <Avatar name={activeApplication.name} size="lg" />
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{activeApplication.name}</h4>
                  <div className="mt-1">
                    <StatusBadge status={activeApplication.status} bankName={activeApplication.bankName} />
                  </div>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="mt-4 space-y-3">
                <ViewRow label="Email Address" value={activeApplication.email} />
                <ViewRow label="Mobile Number" value={activeApplication.mobile} />
                <ViewRow
                  label="Customer Unique ID"
                  value={activeApplication.uniqueCustomerId || activeApplication.mobile}
                />
                <ViewRow
                  label="Application Status"
                  value={<StatusBadge status={activeApplication.status} bankName={activeApplication.bankName} />}
                />
                {activeApplication.bankName && (
                  <ViewRow
                    label="Approved Bank"
                    value={
                      <span className="font-semibold text-emerald-700">
                        {activeApplication.bankName}
                      </span>
                    }
                  />
                )}
                {activeApplication.description && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mt-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      {activeApplication.status === 'approved' ? 'Approval Notes' : 'Rejection / Decision Remarks'}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{activeApplication.description}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions in View Modal */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false)
                      openApprove(activeApplication)
                    }}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false)
                      openReject(activeApplication)
                    }}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                  >
                    Reject
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  )
}
