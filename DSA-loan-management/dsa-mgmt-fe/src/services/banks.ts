import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

export type BankDocumentItem = {
  id: number
  documentName?: string
  name?: string
  documentLocation?: string
  fileName?: string
  createdAt?: string | null
}

export type Bank = {
  id: number
  name: string
  isNationalize: boolean
  isPrivate: boolean
  isnbfc: boolean
  logo?: string
}

export const fetchBanks = async (params?: {
  include_inactive?: boolean
  product_id?: number
}): Promise<Bank[]> => {
  const queryParams: Record<string, any> = {}
  if (params && typeof params === 'object') {
    if (typeof params.include_inactive === 'boolean') {
      queryParams.include_inactive = params.include_inactive
    }
    if (typeof params.product_id === 'number' && !isNaN(params.product_id)) {
      queryParams.product_id = params.product_id
    }
  }
  const res = await apiClient.get<ApiResponse<Bank[]>>(API_ENDPOINT_NAMES.BANKS.BASE, {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  })
  return res.data?.result ?? res.data ?? []
}

export const createBank = async (payload: {
  name: string
  isNationalize?: boolean
  isPrivate?: boolean
  isnbfc?: boolean
  file?: File
}) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('isNationalize', String(!!payload.isNationalize))
  fd.append('isPrivate', String(!!payload.isPrivate))
  fd.append('isnbfc', String(!!payload.isnbfc))
  if (payload.file) fd.append('file', payload.file)
  const res = await apiClient.post<ApiResponse<Bank>>(API_ENDPOINT_NAMES.BANKS.BASE, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data?.result ?? res.data
}

export const updateBank = async (
  id: number,
  payload: {
    name: string
    isNationalize?: boolean
    isPrivate?: boolean
    isnbfc?: boolean
    file?: File | null
    remove_logo?: boolean
  }
) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('isNationalize', String(!!payload.isNationalize))
  fd.append('isPrivate', String(!!payload.isPrivate))
  fd.append('isnbfc', String(!!payload.isnbfc))
  if (payload.file) fd.append('file', payload.file)
  if ((payload as any).remove_logo) fd.append('remove_logo', 'true')
  const res = await apiClient.put<ApiResponse<Bank>>(API_ENDPOINT_NAMES.BANKS.BY_ID(id), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data?.result ?? res.data
}

export const deleteBank = async (id: number) => {
  const res = await apiClient.delete<ApiResponse<any>>(API_ENDPOINT_NAMES.BANKS.BY_ID(id))
  return res.data?.result ?? res.data
}

export interface BankPolicyParameters {
  min_cibil?: number
  roi_tier_1_cibil_750_plus?: number
  roi_tier_2_cibil_700_749?: number
  roi_tier_3_cibil_650_699?: number
  roi_tier_4_cibil_below_650?: number
  female_rebate_pct?: number
  min_roi_floor?: number
  processing_fee_pct?: number
  min_processing_fee?: number
  max_processing_fee?: number
  female_fee_concession_pct?: number
  property_insurance_pct?: number
  applicant_insurance_pct?: number
  max_maturity_age_salaried?: number
  max_maturity_age_self_employed?: number
  max_tenure_years?: number
  ltv_ready_pct?: number
  ltv_under_construction_pct?: number
  ltv_flat_pct?: number
  ltv_standard_pct?: number
  special_notes?: string[]
}

export type BankProductLink = {
  productId: number
  productName: string
  productDescription: string
  productImage?: string
  isLinked: boolean
  linkId?: number | null
  commission?: number | null
  policyParameters?: BankPolicyParameters | null
  documents?: BankDocumentItem[]
}

export const fetchBankProducts = async (bankId: number): Promise<BankProductLink[]> => {
  const res = await apiClient.get<ApiResponse<BankProductLink[]>>(API_ENDPOINT_NAMES.BANKS.PRODUCTS(bankId))
  return res.data?.result ?? res.data ?? []
}

export const linkBankProduct = async (
  bankId: number,
  productId: number,
  payload: {
    is_linked: boolean
    commission?: number | null
  }
) => {
  const fd = new FormData()
  fd.append('is_linked', String(payload.is_linked))
  if (payload.commission !== undefined && payload.commission !== null) {
    fd.append('commission', String(payload.commission))
  }
  const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINT_NAMES.BANKS.PRODUCT_LINK(bankId, productId), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data?.result ?? res.data
}

export const uploadBankProductDocument = async (
  bankId: number,
  productId: number,
  file: File,
  documentName?: string
) => {
  const fd = new FormData()
  fd.append('file', file)
  if (documentName && documentName.trim()) {
    fd.append('document_name', documentName.trim())
  }
  const res = await apiClient.post<ApiResponse<any>>(
    API_ENDPOINT_NAMES.BANKS.PRODUCT_DOCUMENTS(bankId, productId),
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return res.data?.result ?? res.data
}

export const deleteBankProductDocument = async (
  bankId: number,
  productId: number,
  documentId: number
) => {
  const res = await apiClient.delete<ApiResponse<any>>(
    API_ENDPOINT_NAMES.BANKS.PRODUCT_DOCUMENT_BY_ID(bankId, productId, documentId)
  )
  return res.data?.result ?? res.data
}

export const fetchPolicyParameters = async (
  bankId: number,
  productId: number
): Promise<BankPolicyParameters> => {
  const res = await apiClient.get<ApiResponse<BankPolicyParameters>>(
    API_ENDPOINT_NAMES.BANKS.POLICY_PARAMETERS(bankId, productId)
  )
  return res.data?.result ?? res.data
}

export const savePolicyParameters = async (
  bankId: number,
  productId: number,
  payload: BankPolicyParameters
): Promise<BankPolicyParameters> => {
  const res = await apiClient.put<ApiResponse<BankPolicyParameters>>(
    API_ENDPOINT_NAMES.BANKS.POLICY_PARAMETERS(bankId, productId),
    payload
  )
  return res.data?.result ?? res.data
}


