import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCustomers, Customer } from '../../services/customers'
import { useAuth } from '../../auth/AuthProvider'

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }
  const initial = name ? name.charAt(0).toUpperCase() : 'C'
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
    >
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

export default function AgentCustomerList() {
  const { user } = useAuth()
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  // Fetch only customers assigned to the logged-in agent
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['agent-customers', user?.id],
    queryFn: () => fetchCustomers(user?.id),
    enabled: true,
  })

  function openView(c: Customer) {
    setActiveCustomer(c)
    setShowViewModal(true)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Assigned Customers</h2>
          <p className="text-sm text-slate-500">
            View all loan applicants and customer files currently assigned to you
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs font-semibold text-blue-700">
          Total Assigned: {customers.length}
        </div>
      </div>

      {/* Customer Table */}
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
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  Loading your assigned customers…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  <div className="mx-auto max-w-sm text-center">
                    <span className="text-3xl">📂</span>
                    <div className="mt-2 font-medium text-slate-600">No customers assigned yet</div>
                    <p className="mt-1 text-xs text-slate-400">
                      When the admin assigns customer loan files to you, they will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
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
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openView(c)}
                      className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── View Customer Modal ────────────────────────────────────────── */}
      {showViewModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">Customer Details</h3>
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
                <Avatar name={activeCustomer.name} size="lg" />
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{activeCustomer.name}</h4>
                  <div className="mt-1">
                    <StatusBadge status={activeCustomer.status} />
                  </div>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="mt-4 space-y-3">
                <ViewRow label="Email Address" value={activeCustomer.email} />
                <ViewRow label="Mobile Number" value={activeCustomer.mobile} />
                <ViewRow
                  label="Customer Unique ID"
                  value={activeCustomer.uniqueCustomerId || activeCustomer.mobile}
                />
                <ViewRow label="Application Status" value={activeCustomer.status} />
              </div>

              {/* Close Action */}
              <div className="mt-6 flex justify-end">
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

