import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

type Role = 'admin' | 'agent' | 'customer'

interface SidebarProps {
  role: Role
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation()

  const adminMenu = [
    { to: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard' },
    { to: ROUTES.ADMIN.PRODUCTS, label: 'Manage Products' },
    { to: ROUTES.ADMIN.BANKS, label: 'Manage Banks' },
    { to: ROUTES.ADMIN.AGENTS, label: 'Manage Agents' },
    { to: ROUTES.ADMIN.LOAN_APPLICATIONS, label: 'Loan Applications' },
    { to: ROUTES.ADMIN.CONTACT_ENQUIRIES, label: 'Contact Enquiries' },
  ]

  const agentMenu = [
    { to: ROUTES.AGENT.LOAN_APPLICATIONS, label: 'Loan Applications' },
    { to: ROUTES.AGENT.CHAT_WITH_AI, label: 'Chat with AI' },
  ]

  const customerMenu = [
    { to: ROUTES.CUSTOMER.PORTAL, label: 'Portal' },
    { to: ROUTES.CUSTOMER.LOANS, label: 'My Loans' },
    { to: ROUTES.CUSTOMER.CHAT_WITH_AI, label: 'Chat with AI' },
  ]

  const items = role === 'admin' ? adminMenu : role === 'agent' ? agentMenu : customerMenu

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
      <div className="p-4">
        <div className="mb-4 text-sm font-semibold text-slate-700">Navigation</div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const isActive = location.pathname === it.to
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {it.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
