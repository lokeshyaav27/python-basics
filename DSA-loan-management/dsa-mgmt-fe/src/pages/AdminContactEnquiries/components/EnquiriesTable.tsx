import React from 'react'
import { Tooltip } from 'antd'
import { EyeOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { ContactEnquiry } from '../../../services/contact'

const getStatusBadge = (status: string) => {
  const normalized = (status || 'new').toLowerCase().replace(' ', '_')
  const styles: Record<string, { label: string; color: string; icon: string }> = {
    new: { label: 'New / Unread', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🟡' },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔵' },
    contacted: { label: 'Contacted', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🟣' },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🟢' },
    closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '⚪' },
  }
  const item = styles[normalized] || {
    label: status || 'New',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: '🟡',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.color}`}
    >
      <span className="text-[10px]">{item.icon}</span>
      {item.label}
    </span>
  )
}

interface EnquiriesTableProps {
  enquiries: ContactEnquiry[]
  isLoading: boolean
  onSelect: (item: ContactEnquiry) => void
}

export const EnquiriesTable: React.FC<EnquiriesTableProps> = ({
  enquiries,
  isLoading,
  onSelect,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full table-auto text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
          <tr>
            <th className="p-3">Customer</th>
            <th className="p-3">Contact Details</th>
            <th className="p-3">Loan Category</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-slate-400">
                Loading inquiries…
              </td>
            </tr>
          ) : enquiries.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-slate-400">
                No contact enquiries found.
              </td>
            </tr>
          ) : (
            enquiries.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="p-3">
                  <div className="font-bold text-slate-800">{item.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">ID: #{item.id}</div>
                </td>
                <td className="p-3">
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <MailOutlined className="text-slate-400" /> {item.email}
                  </div>
                  <div className="text-slate-600 font-mono flex items-center gap-1.5 mt-0.5">
                    <PhoneOutlined className="text-slate-400" /> {item.mobile}
                  </div>
                </td>
                <td className="p-3">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 border border-blue-100">
                    {item.loanType || 'General'}
                  </span>
                </td>
                <td className="p-3">{getStatusBadge(item.status)}</td>
                <td className="p-3">
                  <Tooltip title="View Message & Follow-up">
                    <button
                      onClick={() => onSelect(item)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                    >
                      <EyeOutlined />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default EnquiriesTable
