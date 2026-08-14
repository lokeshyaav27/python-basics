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
