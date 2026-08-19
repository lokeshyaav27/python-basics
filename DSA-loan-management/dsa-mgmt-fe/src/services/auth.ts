import apiClient from './apiClient'

export async function requestCustomerOtp(mobile: string) {
  const res = await apiClient.post('/api/auth/customer/request-otp', { mobile })
  return res.data
}

export async function verifyCustomerOtp(mobile: string, otp: string) {
  const res = await apiClient.post('/api/auth/customer/verify-otp', { mobile, otp })
  return res.data
}

export async function agentLogin(email: string, password: string) {
  const res = await apiClient.post('/api/auth/agent-login', { email, password })
  return res.data
}

export async function adminLogin(email: string, password: string) {
  const res = await apiClient.post('/api/auth/admin-login', { email, password })
  return res.data
}

export async function resetAgentPassword(newPassword: string, token?: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await apiClient.post(
    '/api/auth/agent/reset-password',
    { newPassword },
    { headers }
  )
  return res.data
}

export async function getAuthProfile() {
  const res = await apiClient.get('/api/auth/me')
  return res.data
}
