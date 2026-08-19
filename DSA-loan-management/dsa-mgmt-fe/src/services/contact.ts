import apiClient from './apiClient'

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

export const submitContactEnquiry = async (
  payload: ContactEnquiryInput
): Promise<{ status: string; enquiry: ContactEnquiry }> => {
  const res = await apiClient.post('/api/contact', payload)
  return res.data
}

export const fetchContactEnquiries = async (): Promise<ContactEnquiry[]> => {
  const res = await apiClient.get('/api/contact')
  return res.data || []
}

export const updateContactEnquiryStatus = async (
  enquiryId: number,
  status: string
): Promise<{ status: string; enquiry: ContactEnquiry }> => {
  const res = await apiClient.put(`/api/contact/${enquiryId}/status`, { status })
  return res.data
}
