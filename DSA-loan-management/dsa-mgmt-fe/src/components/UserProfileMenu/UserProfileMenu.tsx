import React from 'react'
import { Popover } from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CheckCircleFilled,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../auth/AuthProvider'
import { API_BASE_URL } from '../../constants'

export const UserProfileMenu: React.FC = () => {
  const { user, logout } = useAuth()

  if (!user) return null

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const role = (user.role || '').toLowerCase()
  const roleConfig: Record<string, { label: string; badge: string; gradient: string }> = {
    admin: {
      label: 'System Administrator',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      gradient: 'from-indigo-600 to-purple-700',
    },
    agent: {
      label: 'Certified Loan Advisor',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      gradient: 'from-blue-600 to-indigo-700',
    },
    customer: {
      label: 'Loan Applicant / Customer',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      gradient: 'from-emerald-600 to-teal-700',
    },
  }

  const currentRole = roleConfig[role] || {
    label: user.role || 'User',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-blue-600 to-slate-800',
  }

  const initials = getInitials(user.name)

  const popoverContent = (
    <div className="w-72 p-1 text-slate-700 space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
        <div className="relative">
          {user.photo ? (
            <img
              src={`${API_BASE_URL}/static/agent-photos/${user.photo}`}
              alt={user.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
            />
          ) : (
            <div
              className={`h-12 w-12 rounded-full bg-gradient-to-br ${currentRole.gradient} flex items-center justify-center text-white font-extrabold text-base shadow-md ring-2 ring-slate-100`}
            >
              {initials}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
          </div>
          <span
            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${currentRole.badge}`}
          >
            {currentRole.label}
          </span>
        </div>
      </div>

      {/* Profile Details List */}
      <div className="space-y-2.5 text-xs">
        {user.email && (
          <div className="flex items-start gap-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <MailOutlined className="text-blue-500 text-sm mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Email Address</span>
              <a
                href={`mailto:${user.email}`}
                className="text-slate-800 font-medium hover:text-blue-600 transition truncate block"
              >
                {user.email}
              </a>
            </div>
          </div>
        )}

        {user.mobile && (
          <div className="flex items-start gap-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <PhoneOutlined className="text-emerald-500 text-sm mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Contact Number</span>
              <a
                href={`tel:${user.mobile}`}
                className="text-slate-800 font-mono font-medium hover:text-emerald-600 transition block"
              >
                {user.mobile}
              </a>
            </div>
          </div>
        )}

        {user.id && (
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <IdcardOutlined className="text-slate-400" /> Account ID
            </span>
            <span className="font-mono font-bold text-slate-700">#{user.id}</span>
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircleFilled className="text-emerald-500" /> Account Status
          </span>
          <span className="font-bold text-emerald-600">Active</span>
        </div>
      </div>

      {/* Logout Action in Popover */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 py-2 text-xs font-bold transition cursor-pointer border border-red-200/60 shadow-2xs active:scale-98"
        >
          <LogoutOutlined /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <Popover
      content={popoverContent}
      trigger={['hover', 'click']}
      placement="bottomRight"
      overlayClassName="rounded-2xl"
    >
      <div className="inline-flex items-center gap-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 pl-1.5 pr-3 py-1 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs hover:scale-102 active:scale-98 select-none">
        {/* Circle Avatar / Photo */}
        {user.photo ? (
          <img
            src={`${API_BASE_URL}/static/agent-photos/${user.photo}`}
            alt={user.name}
            className="h-7 w-7 rounded-full object-cover border border-white shadow-2xs"
          />
        ) : (
          <div
            className={`h-7 w-7 rounded-full bg-gradient-to-br ${currentRole.gradient} flex items-center justify-center text-white font-bold text-[11px] shadow-2xs`}
          >
            {initials}
          </div>
        )}

        {/* User Name & Role Pill */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-800 max-w-[130px] truncate">{user.name}</span>
          <span className="text-[10px] text-slate-400 font-normal">({role})</span>
          <DownOutlined className="text-[9px] text-slate-400 ml-0.5" />
        </div>
      </div>
    </Popover>
  )
}

export default UserProfileMenu
