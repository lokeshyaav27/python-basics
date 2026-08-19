import apiClient from './apiClient'

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

export async function fetchBanks(): Promise<Bank[]> {
  const res = await apiClient.get('/api/banks')
  return res.data || []
}

export async function createBank(payload: {
  name: string
  isNationalize?: boolean
  isPrivate?: boolean
  isnbfc?: boolean
  file?: File
}) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('isNationalize', String(!!payload.isNationalize))
  fd.append('isPrivate', String(!!payload.isPrivate))
  fd.append('isnbfc', String(!!payload.isnbfc))
  if (payload.file) fd.append('file', payload.file)
  const res = await apiClient.post('/api/banks', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function updateBank(
  id: number,
  payload: {
    name: string
    isNationalize?: boolean
    isPrivate?: boolean
    isnbfc?: boolean
    file?: File | null
    remove_logo?: boolean
  }
) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('isNationalize', String(!!payload.isNationalize))
  fd.append('isPrivate', String(!!payload.isPrivate))
  fd.append('isnbfc', String(!!payload.isnbfc))
  if (payload.file) fd.append('file', payload.file)
  if ((payload as any).remove_logo) fd.append('remove_logo', 'true')
  const res = await apiClient.put(`/api/banks/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteBank(id: number) {
  const res = await apiClient.delete(`/api/banks/${id}`)
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

export async function fetchBankProducts(bankId: number): Promise<BankProductLink[]> {
  const res = await apiClient.get(`/api/banks/${bankId}/products`)
  return res.data || []
}

export async function linkBankProduct(
  bankId: number,
  productId: number,
  payload: {
    is_linked: boolean
    commission?: number | null
  }
) {
  const fd = new FormData()
  fd.append('is_linked', String(payload.is_linked))
  if (payload.commission !== undefined && payload.commission !== null) {
    fd.append('commission', String(payload.commission))
  }
  const res = await apiClient.post(`/api/banks/${bankId}/products/${productId}/link`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadBankProductDocument(
  bankId: number,
  productId: number,
  file: File,
  documentName?: string
) {
  const fd = new FormData()
  fd.append('file', file)
  if (documentName && documentName.trim()) {
    fd.append('document_name', documentName.trim())
  }
  const res = await apiClient.post(
    `/api/banks/${bankId}/products/${productId}/documents`,
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return res.data
}

export async function deleteBankProductDocument(
  bankId: number,
  productId: number,
  documentId: number
) {
  const res = await apiClient.delete(
    `/api/banks/${bankId}/products/${productId}/documents/${documentId}`
  )
  return res.data
}
