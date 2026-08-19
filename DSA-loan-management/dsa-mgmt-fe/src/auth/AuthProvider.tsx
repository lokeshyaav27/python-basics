import React, { createContext, useContext, ReactNode } from 'react'
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
  login: (token: string, user: UserDetails) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const { user, accessToken, isAuthenticated } = useAppSelector(
    (state) => state.auth
  )

  const login = (token: string, userDetails: UserDetails) => {
    if (!token) {
      console.error('Cannot create session without a valid token')
      return
    }
    dispatch(
      setCredentials({
        accessToken: token,
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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
