import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

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
  adminComment?: string | null
  createdAt?: string | null
  isActive: boolean
}

export const submitContactEnquiry = async (
  payload: ContactEnquiryInput
): Promise<{ status: string; enquiry: ContactEnquiry }> => {
  const res = await apiClient.post<ApiResponse<ContactEnquiry>>(API_ENDPOINT_NAMES.CONTACT.BASE, payload)
  const enquiry = res.data?.result ?? (res.data as any)?.enquiry ?? res.data
  return { status: 'ok', enquiry }
}

export const fetchContactEnquiries = async (): Promise<ContactEnquiry[]> => {
  const res = await apiClient.get<ApiResponse<ContactEnquiry[]>>(API_ENDPOINT_NAMES.CONTACT.BASE)
  return res.data?.result ?? res.data ?? []
}

export const updateContactEnquiryStatus = async (
  enquiryId: number,
  status: string,
  adminComment?: string
): Promise<{ status: string; enquiry: ContactEnquiry }> => {
  const payload: { status?: string; adminComment?: string } = { status }
  if (adminComment !== undefined) {
    payload.adminComment = adminComment
  }
  const res = await apiClient.put<ApiResponse<ContactEnquiry>>(API_ENDPOINT_NAMES.CONTACT.STATUS(enquiryId), payload)
  const enquiry = res.data?.result ?? (res.data as any)?.enquiry ?? res.data
  return { status: 'ok', enquiry }
}

export const updateContactEnquiry = async (
  enquiryId: number,
  payload: { status?: string; adminComment?: string }
): Promise<{ status: string; enquiry: ContactEnquiry }> => {
  const res = await apiClient.put<ApiResponse<ContactEnquiry>>(API_ENDPOINT_NAMES.CONTACT.STATUS(enquiryId), payload)
  const enquiry = res.data?.result ?? (res.data as any)?.enquiry ?? res.data
  return { status: 'ok', enquiry }
}
