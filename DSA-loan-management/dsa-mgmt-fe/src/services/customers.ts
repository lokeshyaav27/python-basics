import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export type CustomerInput = {
  name: string
  email: string
  mobile: string
}

export type Customer = {
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
  status: string
  description?: string | null
}

export async function fetchCustomers(agentId?: number): Promise<Customer[]> {
  const params = agentId !== undefined && agentId !== null ? { agent_id: agentId } : {}
  const res = await axios.get(`${API_BASE_URL}/api/customers`, { params })
  return res.data || []
}

export async function assignCustomerAgent(customerId: number, agentId: number | null): Promise<Customer> {
  const res = await axios.put(`${API_BASE_URL}/api/customers/${customerId}/assign-agent`, { agentId })
  return res.data
}

export async function updateCustomerStatus(
  customerId: number,
  payload: { status: string; bankId?: number | null; description?: string | null }
): Promise<Customer> {
  const res = await axios.put(`${API_BASE_URL}/api/customers/${customerId}/status`, payload)
  return res.data
}

export async function createCustomer(payload: CustomerInput): Promise<Customer> {
  const res = await axios.post(`${API_BASE_URL}/api/customers`, payload)
  return res.data
}

export async function updateCustomer(id: number, payload: CustomerInput): Promise<Customer> {
  const res = await axios.put(`${API_BASE_URL}/api/customers/${id}`, payload)
  return res.data
}

export async function deleteCustomer(id: number): Promise<{ status: string }> {
  const res = await axios.delete(`${API_BASE_URL}/api/customers/${id}`)
  return res.data
}

export async function addCustomer(payload: CustomerInput) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/customer/add`, payload)
  return res.data
}