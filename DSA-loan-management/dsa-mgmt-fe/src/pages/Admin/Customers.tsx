import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, Customer } from '../../services/customers'
import { message } from 'antd'

const BLANK_FORM = { name: '', email: '', mobile: '' }

function Avatar({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : 'C'
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
      {initial}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let badgeStyle = 'bg-slate-100 text-slate-600'
  let label = status

  switch (status) {
    case 'not-started':
      badgeStyle = 'bg-amber-100 text-amber-700'
      label = 'Not Started'
      break
    case 'inprogress':
      badgeStyle = 'bg-blue-100 text-blue-700'
      label = 'In Progress'
      break
    case 'forwardedToBank':
      badgeStyle = 'bg-emerald-100 text-emerald-700'
      label = 'Forwarded to Bank'
      break
    case 'rejected':
      badgeStyle = 'bg-red-100 text-red-700'
      label = 'Rejected'
      break
    default:
      label = status
  }

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
      {label}
    </span>
  )
}

export default function CustomersPage() {
  const qc = useQueryClient()
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['admin-customers'],
    queryFn: fetchCustomers,
  })

  const createMut = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
      message.success('Customer created successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to create customer')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: typeof BLANK_FORM }) => updateCustomer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
      message.success('Customer updated successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update customer')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
      message.success('Customer deleted successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to delete customer')
    },
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [active, setActive] = useState<Customer | null>(null)
  const [form, setForm] = useState(BLANK_FORM)

  function openAdd() {
    setForm(BLANK_FORM)
    setShowAdd(true)
  }

  function openEdit(c: Customer) {
    setActive(c)
    setForm({ name: c.name, email: c.email, mobile: c.mobile })
    setShowEdit(true)
  }

  function openView(c: Customer) {
    setActive(c)
    setShowView(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await createMut.mutateAsync({
      name: form.name,
      email: form.email,
      mobile: form.mobile,
    })
    setShowAdd(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    await updateMut.mutateAsync({
      id: active.id,
      payload: {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
      },
    })
    setShowEdit(false)
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
          <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
          <p className="text-sm text-slate-500">Manage customers and their loan applications</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          + Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-slate-400">Loading…</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-slate-400">No customers found.</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div>
                        <span className="block text-sm font-medium text-slate-800">{c.name}</span>
                        {c.uniqueCustomerId && (
                          <span className="block text-[11px] text-slate-400 font-mono">ID: {c.uniqueCustomerId}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-600">{c.email}</td>
                  <td className="p-3 text-sm text-slate-600">{c.mobile}</td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(c)}
                        className="rounded px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded px-3 py-1 text-xs font-medium bg-yellow-100 hover:bg-yellow-200 text-yellow-800 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ open: true, id: c.id })}
                        className="rounded px-3 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Customer" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Full Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rahul Sharma"
                className={inputCls}
              />
            </Field>
            <Field label="Email Address">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="customer@example.com"
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
              submitLabel="Create Customer"
              submitClass="bg-blue-600 hover:bg-blue-700 text-white"
            />
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {showEdit && active && (
        <Modal title="Edit Customer" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Full Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
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
        <Modal title="Customer Details" onClose={() => setShowView(false)}>
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100">
            <Avatar name={active.name} />
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-800">{active.name}</div>
              <div className="mt-1">
                <StatusBadge status={active.status} />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <ViewRow label="Email" value={active.email} />
            <ViewRow label="Mobile" value={active.mobile} />
            <ViewRow label="Customer ID" value={active.uniqueCustomerId || active.mobile} />
            <ViewRow label="Status" value={active.status} />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowView(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">🗑️</span>
              <h3 className="text-lg font-semibold text-slate-800">Delete Customer</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this customer? This action cannot be undone.
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

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
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

