import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'

export type BankDocumentItem = {
  id: number
  name: string
  fileName: string
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

export const fetchBanks = async (): Promise<Bank[]> => {
  const res = await apiClient.get(API_ENDPOINT_NAMES.BANKS.BASE)
  return res.data || []
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
  const res = await apiClient.post(API_ENDPOINT_NAMES.BANKS.BASE, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
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
  const res = await apiClient.put(API_ENDPOINT_NAMES.BANKS.BY_ID(id), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const deleteBank = async (id: number) => {
  const res = await apiClient.delete(API_ENDPOINT_NAMES.BANKS.BY_ID(id))
  return res.data
}

export type BankProductLink = {
  productId: number
  productName: string
  productDescription: string
  productImage?: string
  isLinked: boolean
  linkId?: number | null
  commission?: number | null
  documents?: BankDocumentItem[]
}

export const fetchBankProducts = async (bankId: number): Promise<BankProductLink[]> => {
  const res = await apiClient.get(API_ENDPOINT_NAMES.BANKS.PRODUCTS(bankId))
  return res.data || []
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
  const res = await apiClient.post(API_ENDPOINT_NAMES.BANKS.PRODUCT_LINK(bankId, productId), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
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
  const res = await apiClient.post(
    API_ENDPOINT_NAMES.BANKS.PRODUCT_DOCUMENTS(bankId, productId),
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return res.data
}

export const deleteBankProductDocument = async (
  bankId: number,
  productId: number,
  documentId: number
) => {
  const res = await apiClient.delete(
    API_ENDPOINT_NAMES.BANKS.PRODUCT_DOCUMENT_BY_ID(bankId, productId, documentId)
  )
  return res.data
}
