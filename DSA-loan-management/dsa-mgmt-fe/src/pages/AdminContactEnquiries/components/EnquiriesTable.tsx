import React, { useState } from 'react'
import { Tooltip, Dropdown, MenuProps } from 'antd'
import {
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  DownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PhoneFilled,
  CheckOutlined,
  StopOutlined,
  SaveOutlined,
  CommentOutlined,
} from '@ant-design/icons'
import { ContactEnquiry } from '../../../services/contact'

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  new: {
    label: 'New / Unread',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <span className="text-[10px]">🟡</span>,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <ClockCircleOutlined className="text-blue-600 text-xs" />,
  },
  contacted: {
    label: 'Contacted',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: <PhoneFilled className="text-purple-600 text-xs" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircleOutlined className="text-emerald-600 text-xs" />,
  },
  closed: {
    label: 'Closed',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: <StopOutlined className="text-slate-500 text-xs" />,
  },
}

export const getStatusBadge = (status: string) => {
  const normalized = (status || 'new').toLowerCase().replace(' ', '_')
  const item = STATUS_CONFIG[normalized] || {
    label: status || 'New',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: <span className="text-[10px]">🟡</span>,
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.bg} ${item.color} ${item.border}`}
    >
      {item.icon}
      {item.label}
    </span>
  )
}

interface EnquiriesTableProps {
  enquiries: ContactEnquiry[]
  isLoading: boolean
  onSelect: (item: ContactEnquiry) => void
  onUpdateStatus: (id: number, status: string, adminComment?: string) => void
  isUpdating?: boolean
}

// Row component with local comment state for seamless inline editing
const EnquiryRow: React.FC<{
  item: ContactEnquiry
  onSelect: (item: ContactEnquiry) => void
  onUpdateStatus: (id: number, status: string, adminComment?: string) => void
  isUpdating?: boolean
}> = ({ item, onSelect, onUpdateStatus, isUpdating }) => {
  const [comment, setComment] = useState(item.adminComment || '')
  const [isDirty, setIsDirty] = useState(false)

  const handleSaveComment = () => {
    onUpdateStatus(item.id, item.status || 'new', comment)
    setIsDirty(false)
  }

  const getDropdownMenu = (): MenuProps => {
    const currentStatus = (item.status || 'new').toLowerCase().replace(' ', '_')
    const options = [
      { key: 'new', label: '🟡 New / Unread' },
      { key: 'in_progress', label: '🔵 In Progress' },
      { key: 'contacted', label: '🟣 Contacted' },
      { key: 'resolved', label: '🟢 Resolved' },
      { key: 'closed', label: '⚪ Closed' },
    ]

    return {
      items: options.map((opt) => ({
        key: opt.key,
        label: (
          <div className="flex items-center justify-between gap-4 py-0.5 text-xs font-medium">
            <span>{opt.label}</span>
            {currentStatus === opt.key && <CheckOutlined className="text-blue-600 text-xs" />}
          </div>
        ),
        onClick: () => {
          if (currentStatus !== opt.key) {
            onUpdateStatus(item.id, opt.key, comment)
          }
        },
      })),
    }
  }

  return (
    <tr className="hover:bg-slate-50/80 transition">
      {/* Customer Info */}
      <td className="p-3 align-top">
        <div className="font-bold text-slate-800">{item.name}</div>
        <div className="text-[11px] text-slate-400 font-mono">ID: #{item.id}</div>
      </td>

      {/* Contact Details */}
      <td className="p-3 align-top">
        <div className="text-slate-600 flex items-center gap-1.5">
          <MailOutlined className="text-slate-400" /> {item.email}
        </div>
        <div className="text-slate-600 font-mono flex items-center gap-1.5 mt-0.5">
          <PhoneOutlined className="text-slate-400" /> {item.mobile}
        </div>
      </td>

      {/* Loan Category */}
      <td className="p-3 align-top">
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 border border-blue-100 whitespace-nowrap">
          {item.loanType || 'General'}
        </span>
      </td>

      {/* Customer Description / Message Column */}
      <td className="p-3 align-top max-w-xs">
        <Tooltip title={item.message || 'No description provided'}>
          <div className="text-xs text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
            {item.message || <span className="text-slate-400 italic">No description</span>}
          </div>
        </Tooltip>
      </td>

      {/* Admin Comment Column */}
      <td className="p-3 align-top min-w-[200px] max-w-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Add admin note…"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setIsDirty(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveComment()
                }
              }}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white"
            />
            {isDirty && (
              <button
                type="button"
                onClick={handleSaveComment}
                disabled={isUpdating}
                className="rounded-lg bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Save Admin Comment"
              >
                <SaveOutlined />
              </button>
            )}
          </div>
          {item.adminComment && !isDirty && (
            <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
              <CommentOutlined className="text-slate-400" />
              <span className="truncate">{item.adminComment}</span>
            </div>
          )}
        </div>
      </td>

      {/* Status Badge */}
      <td className="p-3 align-top whitespace-nowrap">{getStatusBadge(item.status)}</td>

      {/* Action Buttons */}
      <td className="p-3 align-top text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          {/* Action Button: Update Status Dropdown */}
          <Dropdown menu={getDropdownMenu()} trigger={['click']} disabled={isUpdating}>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs transition cursor-pointer active:scale-95"
              title="Change Enquiry Status"
            >
              <span>Status</span>
              <DownOutlined className="text-[10px] text-slate-400" />
            </button>
          </Dropdown>

          {/* Action Button: View Details */}
          <Tooltip title="View Message & Full History">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm shadow-2xs hover:bg-blue-100 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <EyeOutlined />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  )
}

export const EnquiriesTable: React.FC<EnquiriesTableProps> = ({
  enquiries,
  isLoading,
  onSelect,
  onUpdateStatus,
  isUpdating,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full table-auto text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
          <tr>
            <th className="p-3">Customer</th>
            <th className="p-3">Contact Details</th>
            <th className="p-3">Loan Category</th>
            <th className="p-3">Description / Message</th>
            <th className="p-3">Admin Comment</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-400">
                Loading inquiries…
              </td>
            </tr>
          ) : enquiries.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-400">
                No contact enquiries found.
              </td>
            </tr>
          ) : (
            enquiries.map((item) => (
              <EnquiryRow
                key={item.id}
                item={item}
                onSelect={onSelect}
                onUpdateStatus={onUpdateStatus}
                isUpdating={isUpdating}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default EnquiriesTable
