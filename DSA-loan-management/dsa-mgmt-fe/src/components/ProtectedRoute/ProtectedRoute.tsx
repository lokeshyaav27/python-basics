import React, { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, Role } from '../../auth/AuthProvider'
import { ROUTES } from '../../constants/routes'
import Unauthorized from '../Unauthorized'
import Sidebar from '../Sidebar'
import Footer from '../Footer'
import UserProfileMenu from '../UserProfileMenu'
import { changeLanguage } from '../../i18n'

interface ProtectedRouteProps {
  children: ReactNode
  role?: Role | Role[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  if (!user) {
    let loginPath: string = ROUTES.CUSTOMER_LOGIN
    if (role === 'admin' || (Array.isArray(role) && role.includes('admin') && role.length === 1)) {
      loginPath = ROUTES.ADMIN_LOGIN
    } else if (role === 'agent' || (Array.isArray(role) && role.includes('agent') && role.length === 1)) {
      loginPath = ROUTES.AGENT_LOGIN
    }

    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (role) {
    const isAllowed = Array.isArray(role) ? role.includes(user.role as Role) : user.role === role
    if (!isAllowed) {
      return <Unauthorized requiredRole={Array.isArray(role) ? role.join(', ') : role} currentRole={user.role} />
    }
  }

  const effectiveRole = (Array.isArray(role) ? (user.role as Role) : role) || (user.role as Role)
  const currentLang = i18n.language || 'en'
  const isChatPage = location.pathname.includes('chat-with-ai')

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col ${isChatPage ? 'h-screen overflow-hidden' : ''}`}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white">
              D
            </span>
            <div>
              <div className="text-sm font-bold text-slate-900">{t('common.brand')}</div>
              <div className="text-[11px] text-slate-500">{user ? user.name : ''}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* User Profile Badge & Hover Card */}
            <UserProfileMenu />

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => changeLanguage('en')}
                className={`rounded-md px-2.5 py-1 transition ${
                  currentLang.startsWith('en')
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`rounded-md px-2.5 py-1 transition ${
                  currentLang.startsWith('hi')
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition shadow-sm"
            >
              {t('common.nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto flex flex-1 w-full ${isChatPage ? 'overflow-hidden min-h-0' : ''}`}>
        {effectiveRole && <Sidebar role={effectiveRole} />}
        <main className={`flex-1 ${isChatPage ? 'p-3 sm:p-4 overflow-hidden flex flex-col min-h-0' : 'p-6'}`}>{children}</main>
      </div>

      {!isChatPage && <Footer />}
    </div>
  )
}

export default ProtectedRoute

