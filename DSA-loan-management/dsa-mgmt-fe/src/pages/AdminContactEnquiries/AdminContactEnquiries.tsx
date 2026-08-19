import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchContactEnquiries,
  updateContactEnquiryStatus,
  ContactEnquiry,
} from '../../services/contact'
import { message, Modal, Select, Tooltip } from 'antd'
import {
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New / Unread', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'closed', label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' },
]

const getStatusBadge = (status: string) => {
  const normalized = (status || 'new').toLowerCase().replace(' ', '_')
  const opt = STATUS_OPTIONS.find((s) => s.value === normalized) || {
    value: normalized,
    label: status || 'New',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  let icon = '🟡'
  if (normalized === 'resolved') icon = '🟢'
  else if (normalized === 'in_progress') icon = '🔵'
  else if (normalized === 'contacted') icon = '🟣'
  else if (normalized === 'closed') icon = '⚪'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${opt.color}`}
    >
      <span className="text-[10px]">{icon}</span>
      {opt.label}
    </span>
  )
}

const AdminContactEnquiries: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiry | null>(null)

  const {
    data: enquiries = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-contact-enquiries'],
    queryFn: fetchContactEnquiries,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateContactEnquiryStatus(id, status),
    onSuccess: (data) => {
      message.success(`Status updated to "${data?.enquiry?.status || 'updated'}"`)
      queryClient.invalidateQueries({ queryKey: ['admin-contact-enquiries'] })
      if (selectedEnquiry && selectedEnquiry.id === data.enquiry.id) {
        setSelectedEnquiry(data.enquiry)
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update enquiry status')
    },
  })

  const filteredEnquiries = enquiries.filter((item) => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.mobile.toLowerCase().includes(term) ||
      (item.loanType && item.loanType.toLowerCase().includes(term)) ||
      (item.message && item.message.toLowerCase().includes(term))

    const itemStatus = (item.status || 'new').toLowerCase().replace(' ', '_')
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  // Statistics
  const totalCount = enquiries.length
  const newCount = enquiries.filter((e) => (e.status || 'new').toLowerCase() === 'new').length
  const inProgressCount = enquiries.filter((e) =>
    ['in_progress', 'contacted'].includes((e.status || '').toLowerCase())
  ).length
  const resolvedCount = enquiries.filter(
    (e) => (e.status || '').toLowerCase() === 'resolved'
  ).length

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📬</span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Contact & Loan Enquiries
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review customer lead requests and update enquiry follow-up status.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
        >
          <SyncOutlined spin={isFetching} />
          Refresh
        </button>
      </div>

      {/* ── Stat Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <InboxOutlined />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalCount}</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">New</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <ClockCircleOutlined />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">{newCount}</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">In Follow-Up</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <SyncOutlined />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800">{inProgressCount}</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircleOutlined />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800">{resolvedCount}</div>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            type="text"
            placeholder="Search by name, email, mobile, loan type or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="all">All Statuses ({totalCount})</option>
            <option value="new">New ({newCount})</option>
            <option value="in_progress">In Progress</option>
            <option value="contacted">Contacted</option>
            <option value="resolved">Resolved ({resolvedCount})</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* ── Enquiries Table ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Customer / Prospect</th>
                <th className="px-5 py-3.5">Contact Info</th>
                <th className="px-5 py-3.5">Loan Interest</th>
                <th className="px-5 py-3.5">Message / Inquiry</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <SyncOutlined spin className="text-2xl text-blue-600 mb-2" />
                    <p className="text-sm font-semibold">Loading contact inquiries...</p>
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <span className="text-4xl block mb-2">📭</span>
                    <p className="text-base font-bold text-slate-700">No enquiries found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search query or status filter.'
                        : 'Customer inquiries submitted on the website will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((item) => {
                  const createdDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/75 transition">
                      {/* Name & Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold grid place-items-center text-sm shadow-sm flex-shrink-0">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{createdDate}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <a
                            href={`mailto:${item.email}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-medium"
                          >
                            <MailOutlined className="text-slate-400" />
                            {item.email}
                          </a>
                          <a
                            href={`tel:${item.mobile}`}
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-medium"
                          >
                            <PhoneOutlined className="text-slate-400" />
                            {item.mobile}
                          </a>
                        </div>
                      </td>

                      {/* Loan Interest */}
                      <td className="px-5 py-4">
                        {item.loanType ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                            🏷️ {item.loanType}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">General Inquiry</span>
                        )}
                      </td>

                      {/* Message Preview */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {item.message || <span className="text-slate-400 italic">No message text provided.</span>}
                        </p>
                      </td>

                      {/* Status Selector */}
                      <td className="px-5 py-4">
                        <Select
                          size="small"
                          value={(item.status || 'new').toLowerCase().replace(' ', '_')}
                          onChange={(newStatus) =>
                            updateStatusMutation.mutate({ id: item.id, status: newStatus })
                          }
                          className="min-w-[130px]"
                          options={STATUS_OPTIONS.map((s) => ({
                            value: s.value,
                            label: (
                              <span className="text-xs font-semibold">
                                {s.value === 'new' && '🟡 '}
                                {s.value === 'in_progress' && '🔵 '}
                                {s.value === 'contacted' && '🟣 '}
                                {s.value === 'resolved' && '🟢 '}
                                {s.value === 'closed' && '⚪ '}
                                {s.label}
                              </span>
                            ),
                          }))}
                        />
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedEnquiry(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          <EyeOutlined /> View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detailed View Modal ───────────────────────────────────────── */}
      {selectedEnquiry && (
        <Modal
          open={!!selectedEnquiry}
          onCancel={() => setSelectedEnquiry(null)}
          footer={null}
          title={
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              <span className="text-xl">📋</span> Enquiry Details #{selectedEnquiry.id}
            </div>
          }
          width={560}
          centered
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Name</span>
                <span className="font-extrabold text-slate-900 text-base mt-0.5 block">{selectedEnquiry.name}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Date Submitted</span>
                <span className="text-slate-700 font-medium mt-0.5 block">
                  {selectedEnquiry.createdAt
                    ? new Date(selectedEnquiry.createdAt).toLocaleString('en-IN')
                    : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-600 hover:underline font-semibold block mt-0.5">
                  {selectedEnquiry.email}
                </a>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                <a href={`tel:${selectedEnquiry.mobile}`} className="text-blue-600 hover:underline font-semibold block mt-0.5">
                  {selectedEnquiry.mobile}
                </a>
              </div>

              <div className="col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Interested Loan Type</span>
                <span className="inline-flex items-center gap-1 mt-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  🏷️ {selectedEnquiry.loanType || 'General Financial Inquiry'}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Full Inquiry Message
              </span>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                {selectedEnquiry.message || <span className="text-slate-400 italic">No message provided.</span>}
              </div>
            </div>

            {/* Status Changer in Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Current Status:</span>
                {getStatusBadge(selectedEnquiry.status)}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Change Status:</span>
                <Select
                  value={(selectedEnquiry.status || 'new').toLowerCase().replace(' ', '_')}
                  onChange={(newStatus) =>
                    updateStatusMutation.mutate({ id: selectedEnquiry.id, status: newStatus })
                  }
                  options={STATUS_OPTIONS.map((s) => ({
                    value: s.value,
                    label: s.label,
                  }))}
                  className="w-36"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminContactEnquiries
