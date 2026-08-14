import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function fetchBanks() {
  const res = await axios.get(`${API_BASE_URL}/api/banks`)
  return res.data || []
}

export async function createBank(payload: { name: string; isNationalize?: boolean; isPrivate?: boolean; isnbfc?: boolean; file?: File }) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('isNationalize', String(!!payload.isNationalize))
  fd.append('isPrivate', String(!!payload.isPrivate))
  fd.append('isnbfc', String(!!payload.isnbfc))
  if (payload.file) fd.append('file', payload.file)
  const res = await axios.post(`${API_BASE_URL}/api/banks`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function updateBank(id: number, payload: { name: string; isNationalize?: boolean; isPrivate?: boolean; isnbfc?: boolean; file?: File | null; remove_logo?: boolean }) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('isNationalize', String(!!payload.isNationalize))
  fd.append('isPrivate', String(!!payload.isPrivate))
  fd.append('isnbfc', String(!!payload.isnbfc))
  if (payload.file) fd.append('file', payload.file)
  if ((payload as any).remove_logo) fd.append('remove_logo', 'true')
  const res = await axios.put(`${API_BASE_URL}/api/banks/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function deleteBank(id: number) {
  const res = await axios.delete(`${API_BASE_URL}/api/banks/${id}`)
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
  policyDocument?: string | null
}

export async function fetchBankProducts(bankId: number): Promise<BankProductLink[]> {
  const res = await axios.get(`${API_BASE_URL}/api/banks/${bankId}/products`)
  return res.data || []
}

export async function linkBankProduct(
  bankId: number,
  productId: number,
  payload: {
    is_linked: boolean
    commission?: number | null
    file?: File | null
    remove_document?: boolean
  }
) {
  const fd = new FormData()
  fd.append('is_linked', String(payload.is_linked))
  if (payload.commission !== undefined && payload.commission !== null) {
    fd.append('commission', String(payload.commission))
  }
  if (payload.file) {
    fd.append('file', payload.file)
  }
  if (payload.remove_document) {
    fd.append('remove_document', 'true')
  }
  const res = await axios.post(`${API_BASE_URL}/api/banks/${bankId}/products/${productId}/link`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
