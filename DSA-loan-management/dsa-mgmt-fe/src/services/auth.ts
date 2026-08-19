import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

export const requestCustomerOtp = async (mobile: string) => {
  const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINT_NAMES.AUTH.CUSTOMER_REQUEST_OTP, { mobile })
  return res.data?.result ?? res.data
}

export const verifyCustomerOtp = async (mobile: string, otp: string) => {
  const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINT_NAMES.AUTH.CUSTOMER_VERIFY_OTP, { mobile, otp })
  return res.data?.result ?? res.data
}

export const agentLogin = async (email: string, password: string) => {
  const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINT_NAMES.AUTH.AGENT_LOGIN, { email, password })
  return res.data?.result ?? res.data
}

export const adminLogin = async (email: string, password: string) => {
  const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINT_NAMES.AUTH.ADMIN_LOGIN, { email, password })
  return res.data?.result ?? res.data
}

export const resetAgentPassword = async (newPassword: string, token?: string) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await apiClient.post<ApiResponse<any>>(
    API_ENDPOINT_NAMES.AUTH.AGENT_RESET_PASSWORD,
    { newPassword },
    { headers }
  )
  return res.data?.result ?? res.data
}

export const getAuthProfile = async () => {
  const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINT_NAMES.AUTH.ME)
  return res.data?.result ?? res.data
}
