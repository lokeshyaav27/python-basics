import React from 'react'
import {
  InboxOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

interface EnquiryStatsBarProps {
  totalCount: number
  newCount: number
  inProgressCount: number
  resolvedCount: number
}

export const EnquiryStatsBar: React.FC<EnquiryStatsBarProps> = ({
  totalCount,
  newCount,
  inProgressCount,
  resolvedCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold">Total Inquiries</span>
          <InboxOutlined className="text-base text-slate-400" />
        </div>
        <div className="text-2xl font-extrabold text-slate-800">{totalCount}</div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
        <div className="flex items-center justify-between text-amber-700 mb-1">
          <span className="text-xs font-semibold">New / Unread</span>
          <ClockCircleOutlined className="text-base text-amber-500" />
        </div>
        <div className="text-2xl font-extrabold text-amber-800">{newCount}</div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
        <div className="flex items-center justify-between text-blue-700 mb-1">
          <span className="text-xs font-semibold">In Progress</span>
          <SyncOutlined className="text-base text-blue-500" />
        </div>
        <div className="text-2xl font-extrabold text-blue-800">{inProgressCount}</div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
        <div className="flex items-center justify-between text-emerald-700 mb-1">
          <span className="text-xs font-semibold">Resolved</span>
          <CheckCircleOutlined className="text-base text-emerald-500" />
        </div>
        <div className="text-2xl font-extrabold text-emerald-800">{resolvedCount}</div>
      </div>
    </div>
  )
}

export default EnquiryStatsBar
