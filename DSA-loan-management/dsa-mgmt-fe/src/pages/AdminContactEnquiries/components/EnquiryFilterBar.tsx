import React from 'react'
import { SearchOutlined } from '@ant-design/icons'

interface EnquiryFilterBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
}

export const EnquiryFilterBar: React.FC<EnquiryFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <SearchOutlined className="absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, mobile, loan type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="all">All Statuses</option>
        <option value="new">New / Unread</option>
        <option value="in_progress">In Progress</option>
        <option value="contacted">Contacted</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  )
}

export default EnquiryFilterBar
