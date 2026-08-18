import React from 'react'
import { Link } from 'react-router-dom'

type Role = 'admin' | 'agent' | 'customer'

export default function Sidebar({ role }: { role: Role }) {
  const adminMenu = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/products', label: 'Manage Products' },
    { to: '/admin/banks', label: 'Manage Banks' },
    { to: '/admin/agents', label: 'Manage Agents' },
    { to: '/admin/loan-applications', label: 'Loan Applications' },
  ]

  const agentMenu = [
    { to: '/agent/loan-applications', label: 'Loan Applications' },
  ]

  const customerMenu = [
    { to: '/customer', label: 'Portal' },
    { to: '/customer/loans', label: 'My Loans' },
    { to: '/customer/check-eligibility', label: 'Check Eligibility' },
    { to: '/customer/loan-comparison', label: 'Loan Comparison' },
    { to: '/customer/chat-with-ai', label: 'Chat with AI' },
  ]

  const items = role === 'admin' ? adminMenu : role === 'agent' ? agentMenu : customerMenu

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
      <div className="p-4">
        <div className="mb-4 text-sm font-semibold text-slate-700">Navigation</div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
