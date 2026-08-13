import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
type Role = 'admin' | 'agent' | 'customer'

type User = {
  name: string
  role: Role
}

type AuthContextType = {
  user: User | null
  login: (name: string, role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('dsa_auth')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  const login = (name: string, role: Role) => {
    const u = { name, role }
    setUser(u)
    localStorage.setItem('dsa_auth', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dsa_auth')
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: Role }) {
  const { user } = useAuth()
  if (!user) return <NavigateToLogin />
  if (role && user.role !== role) return <Unauthorized />
  return <>{children}</>
}

function NavigateToLogin() {
  // Default to customer login
  return <Navigate to="/customer-login" replace />
}

function Unauthorized() {
  return <div style={{ padding: 24 }}>Unauthorized — you do not have access to this page.</div>
}
