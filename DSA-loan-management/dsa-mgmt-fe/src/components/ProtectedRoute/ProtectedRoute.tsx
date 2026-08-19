import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, Role } from '../../auth/AuthProvider'
import { ROUTES } from '../../constants/routes'
import Unauthorized from '../../pages/Unauthorized'

interface ProtectedRouteProps {
  children: ReactNode
  role?: Role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user } = useAuth()
  const location = useLocation()

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

  return <>{children}</>
}

export default ProtectedRoute
