import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchContactEnquiries,
  updateContactEnquiryStatus,
  ContactEnquiry,
} from '../../services/contact'
import { message } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import {
  EnquiryStatsBar,
  EnquiryFilterBar,
  EnquiryDetailModal,
  EnquiriesTable,
} from './components'

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
    mutationFn: ({
      id,
      status,
      adminComment,
    }: {
      id: number
      status: string
      adminComment?: string
    }) => updateContactEnquiryStatus(id, status, adminComment),
    onSuccess: (data) => {
      message.success(`Enquiry #${data?.enquiry?.id || ''} updated successfully`)
      queryClient.invalidateQueries({ queryKey: ['admin-contact-enquiries'] })
      if (selectedEnquiry && selectedEnquiry.id === data.enquiry.id) {
        setSelectedEnquiry(data.enquiry)
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update enquiry')
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
  const newCount = enquiries.filter(
    (e) => (e.status || 'new').toLowerCase().replace(' ', '_') === 'new'
  ).length
  const inProgressCount = enquiries.filter(
    (e) => (e.status || '').toLowerCase().replace(' ', '_') === 'in_progress'
  ).length
  const resolvedCount = enquiries.filter(
    (e) => (e.status || '').toLowerCase().replace(' ', '_') === 'resolved'
  ).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Contact Enquiries</h2>
          <p className="text-sm text-slate-500">
            Track inquiries submitted through the portal and manage follow-ups
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <SyncOutlined className={isFetching ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Counters Bar */}
      <EnquiryStatsBar
        totalCount={totalCount}
        newCount={newCount}
        inProgressCount={inProgressCount}
        resolvedCount={resolvedCount}
      />

      {/* Filter Bar */}
      <EnquiryFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Table */}
      <EnquiriesTable
        enquiries={filteredEnquiries}
        isLoading={isLoading}
        onSelect={(item) => setSelectedEnquiry(item)}
        onUpdateStatus={(id, status, adminComment) =>
          updateStatusMutation.mutate({ id, status, adminComment })
        }
        isUpdating={updateStatusMutation.isPending}
      />

      {/* Detail Modal */}
      <EnquiryDetailModal
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onUpdateStatus={(id, status, adminComment) =>
          updateStatusMutation.mutate({ id, status, adminComment })
        }
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  )
}

export default AdminContactEnquiries
