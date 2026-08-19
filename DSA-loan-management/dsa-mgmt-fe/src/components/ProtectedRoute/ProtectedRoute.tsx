import React, { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, Role } from '../../auth/AuthProvider'
import { ROUTES } from '../../constants/routes'
import Unauthorized from '../../pages/Unauthorized'
import Sidebar from '../Sidebar'
import Footer from '../Footer'

interface ProtectedRouteProps {
  children: ReactNode
  role?: Role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  if (!user) {
    // Intelligently redirect to the correct portal login page
    let loginPath: string = ROUTES.CUSTOMER_LOGIN
    if (role === 'admin') {
      loginPath = ROUTES.ADMIN_LOGIN
    } else if (role === 'agent') {
      loginPath = ROUTES.AGENT_LOGIN
    }

    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    return <Unauthorized requiredRole={role} currentRole={user.role} />
  }

  const effectiveRole = role || (user.role as Role)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white">
              D
            </span>
            <div>
              <div className="text-sm font-bold text-slate-900">DSA Finance</div>
              <div className="text-[11px] text-slate-500">{user ? user.name : ''}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-1 w-full">
        {effectiveRole && <Sidebar role={effectiveRole} />}
        <main className="flex-1 p-6">{children}</main>
      </div>

      <Footer />
    </div>
  )
}

export default ProtectedRoute
