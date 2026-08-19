import React from 'react'
import { API_BASE_URL } from '../../../constants'

export const BankLogo: React.FC<{ logo?: string; name: string; size?: 'sm' | 'md' | 'lg' }> = ({
  logo,
  name,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }

  if (logo) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl border border-slate-200 bg-white p-1 shadow-xs flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <img
          src={`${API_BASE_URL}/static/bank-logo-images/${logo}`}
          alt={name}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'B'
  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-xs shrink-0`}
    >
      {initial}
    </div>
  )
}

export const BoolBadge: React.FC<{
  value: boolean
  activeLabel: string
  activeColor?: 'emerald' | 'blue' | 'purple'
}> = ({ value, activeLabel, activeColor = 'blue' }) => {
  if (!value) {
    return (
      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
        No
      </span>
    )
  }

  const colorStyles = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border ${colorStyles[activeColor]}`}
    >
      {activeLabel}
    </span>
  )
}
