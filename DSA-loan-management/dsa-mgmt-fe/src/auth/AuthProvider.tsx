import React, { createContext, useContext, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import {
  Role,
  UserDetails,
  setCredentials,
  logout as logoutAction,
} from '../store/slices/authSlice'

export type { Role, UserDetails }

type AuthContextType = {
  user: UserDetails | null
  accessToken: string | null
  token: string | null
  isAuthenticated: boolean
  login: (
    name: string,
    role: Role,
    extra?: Partial<UserDetails>,
    accessToken?: string
  ) => void
  loginWithCredentials: (accessToken: string, user: UserDetails) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch()
  const { user, accessToken, isAuthenticated } = useAppSelector(
    (state) => state.auth
  )

  const loginWithCredentials = (token: string, userDetails: UserDetails) => {
    dispatch(
      setCredentials({
        accessToken: token,
        user: userDetails,
      })
    )
  }

  const login = (
    name: string,
    role: Role,
    extra?: Partial<UserDetails>,
    token?: string
  ) => {
    const userDetails: UserDetails = {
      name,
      role,
      ...extra,
    }
    const finalToken = token || accessToken || 'demo-session-token'
    dispatch(
      setCredentials({
        accessToken: finalToken,
        user: userDetails,
      })
    )
  }

  const logout = () => {
    dispatch(logoutAction())
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        token: accessToken,
        isAuthenticated,
        login,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode
  role?: Role
}) {
  const { user } = useAuth()
  if (!user) return <NavigateToLogin />
  if (role && user.role !== role) return <Unauthorized />
  return <>{children}</>
}

function NavigateToLogin() {
  return <Navigate to="/customer-login" replace />
}

function Unauthorized() {
  return (
    <div style={{ padding: 24 }}>
      Unauthorized — you do not have access to this page.
    </div>
  )
}
