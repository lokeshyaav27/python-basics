import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'

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
  const res = await apiClient.post(API_ENDPOINT_NAMES.CONTACT.BASE, payload)
  return res.data
}

export const fetchContactEnquiries = async (): Promise<ContactEnquiry[]> => {
  const res = await apiClient.get(API_ENDPOINT_NAMES.CONTACT.BASE)
  return res.data || []
}

export const updateContactEnquiryStatus = async (
  enquiryId: number,
  status: string
): Promise<{ status: string; enquiry: ContactEnquiry }> => {
  const res = await apiClient.put(API_ENDPOINT_NAMES.CONTACT.STATUS(enquiryId), { status })
  return res.data
}
