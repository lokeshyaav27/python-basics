import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export type ContactEnquiryInput = {
  name: string
  email: string
  mobile: string
  loanType?: string
  message?: string
}

export type ContactEnquiry = {
  id: number
  name: string
  email: string
  mobile: string
  loanType?: string | null
  message?: string | null
  status: string
  createdAt?: string | null
  isActive: boolean
}

export async function submitContactEnquiry(payload: ContactEnquiryInput): Promise<{ status: string; enquiry: ContactEnquiry }> {
  const res = await axios.post(`${API_BASE_URL}/api/contact`, payload)
  return res.data
}

export async function fetchContactEnquiries(): Promise<ContactEnquiry[]> {
  const res = await axios.get(`${API_BASE_URL}/api/contact`)
  return res.data || []
}
