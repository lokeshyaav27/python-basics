import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchLoanApplications,
  createLoanApplication,
  updateLoanApplication,
  deleteLoanApplication,
  assignLoanApplicationAgent,
  LoanApplication,
} from '../../services/loanApplications'
import { fetchAgents } from '../../services/agents'
import { fetchProducts } from '../../services/products'
import { message, Tooltip } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserSwitchOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import ApplicationDetailModal from '../../components/ApplicationDetailModal'

const BLANK_FORM = { name: '', email: '', mobile: '', productId: null as number | null }
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function Avatar({ name, photo, size = 'md' }: { name: string; photo?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  if (photo) {
    return (
      <img
        src={`${API_BASE_URL}/static/agent-photos/${photo}`}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0`}
      />
    )
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

function StatusBadge({ status, bankName }: { status?: string | null; bankName?: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
        <span>⏳</span> Pending Review
      </span>
    )
  }

  const s = status.toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
        <span>✅</span> Approved {bankName ? `(${bankName})` : ''}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
        <span>❌</span> Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
      <span>⏳</span> Pending Review
    </span>
  )
}

export default function LoanApplicationsPage() {
  const qc = useQueryClient()

  const { data: applications = [], isLoading: isApplicationsLoading } = useQuery<LoanApplication[]>({
    queryKey: ['admin-loan-applications'],
    queryFn: () => fetchLoanApplications(),
  })

  const { data: agents = [] } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: fetchAgents,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
  })

  const createMut = useMutation({
    mutationFn: createLoanApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Loan application created successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to create loan application')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateLoanApplication(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Loan application updated successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update loan application')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteLoanApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Loan application deleted successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to delete loan application')
    },
  })

  const assignAgentMut = useMutation({
    mutationFn: ({ applicationId, agentId }: { applicationId: number; agentId: number | null }) =>
      assignLoanApplicationAgent(applicationId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Agent assigned successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to assign agent')
    },
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [active, setActive] = useState<LoanApplication | null>(null)

  const [form, setForm] = useState(BLANK_FORM)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)

  function openAdd() {
    setForm(BLANK_FORM)
    setShowAdd(true)
  }

  function openEdit(c: LoanApplication) {
    setActive(c)
    setForm({ name: c.name, email: c.email, mobile: c.mobile, productId: c.productId ?? null })
    setShowEdit(true)
  }

  function openView(c: LoanApplication) {
    setActive(c)
    setShowView(true)
  }

  function openAssign(c: LoanApplication) {
    setActive(c)
    setSelectedAgentId(c.agentId ?? null)
    setShowAssign(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await createMut.mutateAsync(form)
    setShowAdd(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    await updateMut.mutateAsync({ id: active.id, payload: form })
    setShowEdit(false)
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    await assignAgentMut.mutateAsync({ applicationId: active.id, agentId: selectedAgentId })
    setShowAssign(false)
  }

  async function handleDelete() {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Loan Applications</h2>
          <p className="text-sm text-slate-500">Manage loan applicants, file status, and assigned DSA agents</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <PlusOutlined /> Add Application
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Agent</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isApplicationsLoading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-slate-400">Loading loan applications…</td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-slate-400">No loan applications found.</td>
              </tr>
            ) : (
              applications.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  {/* Name & ID */}
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

                  {/* Loan Product */}
                  <td className="p-3">
                    {c.productName ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        <span>🏷️</span> {c.productName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not specified</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="p-3 text-sm text-slate-600">{c.email}</td>

                  {/* Mobile */}
                  <td className="p-3 text-sm text-slate-600">{c.mobile}</td>

                  {/* Assigned Agent */}
                  <td className="p-3">
                    {c.agentName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={c.agentName} photo={c.agentPhoto} size="sm" />
                        <span className="text-xs font-medium text-slate-700">{c.agentName}</span>
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400 font-medium">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <StatusBadge status={c.status} bankName={c.bankName} />
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Tooltip title={c.agentId ? 'Change Assigned Agent' : 'Assign DSA Agent'}>
                        <button
                          onClick={() => openAssign(c)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label={c.agentId ? 'Change Agent' : 'Assign Agent'}
                        >
                          {c.agentId ? <UserSwitchOutlined /> : <UserAddOutlined />}
                        </button>
                      </Tooltip>
                      <Tooltip title="View Application Details">
                        <button
                          onClick={() => openView(c)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="View Details"
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Edit Application">
                        <button
                          onClick={() => openEdit(c)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Edit Application"
                        >
                          <EditOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Application">
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: c.id })}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Delete Application"
                        >
                          <DeleteOutlined />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Assign Agent Modal ────────────────────────────────────────── */}
      {showAssign && active && (
        <Modal title={`Assign Agent — ${active.name}`} onClose={() => setShowAssign(false)}>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Select a DSA agent to handle this customer loan application:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {/* Option: Unassigned */}
              <label
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                  selectedAgentId === null
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="agentSelect"
                  checked={selectedAgentId === null}
                  onChange={() => setSelectedAgentId(null)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 font-bold text-xs">
                  ✕
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Unassigned</span>
                  <span className="block text-xs text-slate-400">Do not assign to any specific agent</span>
                </div>
              </label>

              {/* Agent list options */}
              {agents.map((ag: any) => (
                <label
                  key={ag.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    selectedAgentId === ag.id
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="agentSelect"
                    checked={selectedAgentId === ag.id}
                    onChange={() => setSelectedAgentId(ag.id)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Avatar name={ag.name} photo={ag.photo} size="md" />
                  <div className="flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{ag.name}</span>
                    <span className="block text-xs text-slate-400">{ag.email} • {ag.mobile}</span>
                  </div>
                  {ag.isAdmin && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      Admin
                    </span>
                  )}
                </label>
              ))}
            </div>

            <ModalFooter
              onCancel={() => setShowAssign(false)}
              submitLabel="Save Assignment"
              submitClass="bg-blue-600 hover:bg-blue-700 text-white"
            />
          </form>
        </Modal>
      )}

      {/* ── Add Modal ───────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Loan Application" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Applicant Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ramesh Sharma"
                className={inputCls}
              />
            </Field>

            <Field label="Loan Product">
              <select
                value={form.productId ?? ''}
                onChange={(e) => setForm({ ...form, productId: e.target.value ? Number(e.target.value) : null })}
                className={inputCls}
              >
                <option value="">-- Select Loan Product (Optional) --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email Address">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ramesh@example.com"
                className={inputCls}
              />
            </Field>

            <Field label="Mobile Number">
              <input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="9876543210"
                className={inputCls}
              />
            </Field>

            <ModalFooter
              onCancel={() => setShowAdd(false)}
              submitLabel="Create Application"
              submitClass="bg-blue-600 hover:bg-blue-700 text-white"
            />
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {showEdit && active && (
        <Modal title="Edit Loan Application" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Applicant Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Loan Product">
              <select
                value={form.productId ?? ''}
                onChange={(e) => setForm({ ...form, productId: e.target.value ? Number(e.target.value) : null })}
                className={inputCls}
              >
                <option value="">-- Select Loan Product (Optional) --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email Address">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Mobile Number">
              <input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className={inputCls}
              />
            </Field>

            <ModalFooter
              onCancel={() => setShowEdit(false)}
              submitLabel="Save Changes"
              submitClass="bg-yellow-500 hover:bg-yellow-600 text-white"
            />
          </form>
        </Modal>
      )}

      {/* ── View Modal ──────────────────────────────────────────────────── */}
      {showView && active && (
        <ApplicationDetailModal
          application={active}
          onClose={() => {
            setShowView(false)
            setActive(null)
          }}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
            setShowView(false)
            setActive(null)
          }}
        />
      )}

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">🗑️</span>
              <h3 className="text-lg font-semibold text-slate-800">Delete Application</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this loan application?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete({ open: false })}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reusable Modal Helpers ────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
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

function ModalFooter({
  onCancel,
  submitLabel,
  submitClass,
}: {
  onCancel: () => void
  submitLabel: string
  submitClass: string
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
      >
        Cancel
      </button>
      <button type="submit" className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${submitClass}`}>
        {submitLabel}
      </button>
    </div>
  )
}
