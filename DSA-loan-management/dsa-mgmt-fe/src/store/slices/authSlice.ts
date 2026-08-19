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

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
}

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
    },
    logout: (state) => {
      state.accessToken = null
      state.user = null
      state.isAuthenticated = false
    },
    updateUser: (state, action: PayloadAction<Partial<UserDetails>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { setCredentials, logout, updateUser } = authSlice.actions

export default authSlice.reducer
