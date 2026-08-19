import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Role = 'admin' | 'agent' | 'customer'

export interface UserDetails {
  id?: number
  name: string
  email?: string
  mobile?: string
  uniqueCustomerId?: string
  photo?: string
  role: Role
  isAdmin?: boolean
  isActive?: boolean
  tempPasswordReset?: boolean
  productId?: number
  status?: string
}

export interface AuthState {
  accessToken: string | null
  user: UserDetails | null
  isAuthenticated: boolean
}

const loadInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem('dsa_token')
    const rawUser = localStorage.getItem('dsa_user')
    const user = rawUser ? JSON.parse(rawUser) : null
    return {
      accessToken: token || null,
      user: user || null,
      isAuthenticated: Boolean(token && user),
    }
  } catch {
    return {
      accessToken: null,
      user: null,
      isAuthenticated: false,
    }
  }
}

const initialState: AuthState = loadInitialState()

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; user: UserDetails }>
    ) => {
      const { accessToken, user } = action.payload
      state.accessToken = accessToken
      state.user = user
      state.isAuthenticated = true

      try {
        localStorage.setItem('dsa_token', accessToken)
        localStorage.setItem('dsa_user', JSON.stringify(user))
      } catch (err) {
        console.error('Failed to save auth state to localStorage', err)
      }
    },
    logout: (state) => {
      state.accessToken = null
      state.user = null
      state.isAuthenticated = false

      try {
        localStorage.removeItem('dsa_token')
        localStorage.removeItem('dsa_user')
      } catch (err) {
        console.error('Failed to clear auth state from localStorage', err)
      }
    },
    updateUser: (state, action: PayloadAction<Partial<UserDetails>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        try {
          localStorage.setItem('dsa_user', JSON.stringify(state.user))
        } catch (err) {
          console.error('Failed to update auth user in localStorage', err)
        }
      }
    },
  },
})

export const { setCredentials, logout, updateUser } = authSlice.actions

export default authSlice.reducer
