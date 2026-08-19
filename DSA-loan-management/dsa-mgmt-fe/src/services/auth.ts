import apiClient from './apiClient'

export const requestCustomerOtp = async (mobile: string) => {
  const res = await apiClient.post('/api/auth/customer/request-otp', { mobile })
  return res.data
}

export const verifyCustomerOtp = async (mobile: string, otp: string) => {
  const res = await apiClient.post('/api/auth/customer/verify-otp', { mobile, otp })
  return res.data
}

export const agentLogin = async (email: string, password: string) => {
  const res = await apiClient.post('/api/auth/agent-login', { email, password })
  return res.data
}

export const adminLogin = async (email: string, password: string) => {
  const res = await apiClient.post('/api/auth/admin-login', { email, password })
  return res.data
}

export const resetAgentPassword = async (newPassword: string, token?: string) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await apiClient.post(
    '/api/auth/agent/reset-password',
    { newPassword },
    { headers }
  )
  return res.data
}

export const getAuthProfile = async () => {
  const res = await apiClient.get('/api/auth/me')
  return res.data
}
