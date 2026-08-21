import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'

type Role = 'admin' | 'agent' | 'customer'

interface SidebarProps {
  role: Role
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation()
  const { t } = useTranslation()

  const adminMenu = [
    { to: ROUTES.ADMIN.DASHBOARD, label: t('common.nav.dashboard') },
    { to: ROUTES.ADMIN.PRODUCTS, label: t('adminDashboard.cards.productsTitle') },
    { to: ROUTES.ADMIN.BANKS, label: t('adminDashboard.cards.banksTitle') },
    { to: ROUTES.ADMIN.AGENTS, label: t('adminDashboard.cards.agentsTitle') },
    { to: ROUTES.ADMIN.LOAN_APPLICATIONS, label: t('adminDashboard.cards.loansTitle') },
    { to: ROUTES.ADMIN.CONTACT_ENQUIRIES, label: t('common.nav.contactEnquiries') },
    { to: ROUTES.ADMIN.CHAT_WITH_AI, label: t('common.nav.aiAssistant') },
    { to: ROUTES.ADMIN.AI_ISSUES, label: 'AI Issue Reports' },
  ]

  const agentMenu = [
    { to: ROUTES.AGENT.LOAN_APPLICATIONS, label: t('common.nav.loanApplications') },
    { to: ROUTES.AGENT.CHAT_WITH_AI, label: t('common.nav.aiAssistant') },
  ]

  const customerMenu = [
    { to: ROUTES.CUSTOMER.PORTAL, label: t('customerPortal.badge') },
    { to: ROUTES.CUSTOMER.LOANS, label: t('common.nav.myLoans') },
    { to: ROUTES.CUSTOMER.CHAT_WITH_AI, label: t('common.nav.aiAssistant') },
  ]

  const items = role === 'admin' ? adminMenu : role === 'agent' ? agentMenu : customerMenu

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
      <div className="p-4">
        <div className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          {role === 'admin'
            ? t('common.sidebar.adminSection')
            : role === 'agent'
            ? t('common.sidebar.agentSection')
            : t('common.sidebar.customerSection')}
        </div>
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
