import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function requestCustomerOtp(mobile: string) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/customer/request-otp`, { mobile })
  return res.data
}

export async function verifyCustomerOtp(mobile: string, otp: string) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/customer/verify-otp`, { mobile, otp })
  return res.data
}

export async function agentLogin(email: string, password: string) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/agent-login`, { email, password })
  return res.data
}

export async function adminLogin(email: string, password: string) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/admin-login`, { email, password })
  return res.data
}

export async function resetAgentPassword(agentId: number, newPassword: string) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/agent/reset-password`, {
    agentId,
    newPassword,
  })
  return res.data
}
