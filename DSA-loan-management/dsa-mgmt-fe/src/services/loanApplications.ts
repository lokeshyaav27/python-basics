import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export type LoanApplicationInput = {
  name: string
  email: string
  mobile: string
  productId?: number | null
}

export type LoanApplication = {
  id: number
  name: string
  email: string
  mobile: string
  uniqueCustomerId?: string
  agentId?: number | null
  agentName?: string | null
  agentPhoto?: string | null
  bankId?: number | null
  bankName?: string | null
  bankLogo?: string | null
  productId?: number | null
  productName?: string | null
  productIcon?: string | null
  status: string
  description?: string | null
  isActive?: boolean
}

export async function fetchLoanApplications(agentId?: number): Promise<LoanApplication[]> {
  const params = agentId !== undefined && agentId !== null ? { agent_id: agentId } : {}
  const res = await axios.get(`${API_BASE_URL}/api/loan-applications`, { params })
  return res.data || []
}

export async function assignLoanApplicationAgent(
  applicationId: number,
  agentId: number | null
): Promise<LoanApplication> {
  const res = await axios.put(`${API_BASE_URL}/api/loan-applications/${applicationId}/assign-agent`, { agentId })
  return res.data
}

export async function updateLoanApplicationStatus(
  applicationId: number,
  payload: { status: string; bankId?: number | null; description?: string | null }
): Promise<LoanApplication> {
  const res = await axios.put(`${API_BASE_URL}/api/loan-applications/${applicationId}/status`, payload)
  return res.data
}

export async function createLoanApplication(payload: LoanApplicationInput): Promise<LoanApplication> {
  const res = await axios.post(`${API_BASE_URL}/api/loan-applications`, payload)
  return res.data
}

export async function updateLoanApplication(
  id: number,
  payload: LoanApplicationInput
): Promise<LoanApplication> {
  const res = await axios.put(`${API_BASE_URL}/api/loan-applications/${id}`, payload)
  return res.data
}

export async function deleteLoanApplication(id: number): Promise<{ status: string }> {
  const res = await axios.delete(`${API_BASE_URL}/api/loan-applications/${id}`)
  return res.data
}

export async function addLoanApplication(payload: LoanApplicationInput) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/customer/add`, payload)
  return res.data
}

// Backward-compatibility aliases
export type Customer = LoanApplication
export type CustomerInput = LoanApplicationInput
export const fetchCustomers = fetchLoanApplications
export const assignCustomerAgent = assignLoanApplicationAgent
export const updateCustomerStatus = updateLoanApplicationStatus
export const createCustomer = createLoanApplication
export const updateCustomer = updateLoanApplication
export const deleteCustomer = deleteLoanApplication
export const addCustomer = addLoanApplication
