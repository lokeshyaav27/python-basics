import React from 'react'
import { Tooltip } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { LoanApplication } from '../../../services/loanApplications'
import { API_BASE_URL } from '../../../constants'

const Avatar: React.FC<{
  name: string
  photo?: string | null
  size?: 'sm' | 'md' | 'lg'
}> = ({ name, photo, size = 'md' }) => {
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
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 shadow-xs shrink-0`}
      />
    )
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'L'
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-xs shrink-0`}
    >
      {initial}
    </div>
  )
}

const StatusBadge: React.FC<{ status?: string | null; bankName?: string | null }> = ({
  status,
  bankName,
}) => {
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

interface ApplicationTableRowProps {
  app: LoanApplication
  onViewDetails: (app: LoanApplication) => void
  onAssignAgent: (app: LoanApplication) => void
  onEdit: (app: LoanApplication) => void
  onDelete: (id: number) => void
}

export const ApplicationTableRow: React.FC<ApplicationTableRowProps> = ({
  app,
  onViewDetails,
  onAssignAgent,
  onEdit,
  onDelete,
}) => {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition">
      <td className="p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={app.name || 'User'} size="sm" />
          <div>
            <span className="block text-sm font-semibold text-slate-800">
              {app.name || 'Anonymous User'}
            </span>
            <span className="block text-xs text-slate-400 font-mono">
              #{app.id} • {app.mobile || app.email}
            </span>
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
          {app.productName || 'General Loan'}
        </span>
      </td>
      <td className="p-3">
        <StatusBadge status={app.status} bankName={app.bankName} />
      </td>
      <td className="p-3">
        {app.agentName ? (
          <div className="flex items-center gap-2">
            <Avatar name={app.agentName} photo={app.agentPhoto} size="sm" />
            <div>
              <span className="block text-xs font-bold text-slate-800">{app.agentName}</span>
              <span className="block text-[11px] text-slate-400">{app.agentMobile}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAssignAgent(app)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            <UserAddOutlined /> Assign Agent
          </button>
        )}
      </td>
      <td className="p-3">

        {app.commissionReceived !== undefined && app.commissionReceived !== null && app.commissionReceived > 0 ? (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs w-fit">
              <span>💰</span> ₹{app.commissionReceived.toLocaleString('en-IN')}
            </span>
            {app.commissionRatePct && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                Slab: {app.commissionRatePct}%
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center text-xs text-slate-400">
            —
          </span>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1.5">

          <Tooltip title="View Complete Application & 11 Financial Parameters">
            <button
              onClick={() => onViewDetails(app)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
            >
              <EyeOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Assign / Change DSA Agent">
            <button
              onClick={() => onAssignAgent(app)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-indigo-200"
            >
              <UserSwitchOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Edit Basic Details">
            <button
              onClick={() => onEdit(app)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-amber-200/70"
            >
              <EditOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Delete Application">
            <button
              onClick={() => onDelete(app.id)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-rose-200/70"
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  )
}

export default ApplicationTableRow
