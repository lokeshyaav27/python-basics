import apiClient from './apiClient'

export async function fetchAgents() {
  const res = await apiClient.get('/api/agents')
  return res.data || []
}

export async function createAgent(payload: {
  name: string
  email: string
  mobile: string
  password: string
  isAdmin?: boolean
  file?: File | null
}) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('email', payload.email)
  fd.append('mobile', payload.mobile)
  fd.append('password', payload.password)
  fd.append('isAdmin', String(!!payload.isAdmin))
  if (payload.file) fd.append('file', payload.file)
  const res = await apiClient.post('/api/agents', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function updateAgent(
  id: number,
  payload: {
    name: string
    email: string
    mobile: string
    isAdmin?: boolean
    file?: File | null
    remove_photo?: boolean
  }
) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('email', payload.email)
  fd.append('mobile', payload.mobile)
  fd.append('isAdmin', String(!!payload.isAdmin))
  if (payload.file) fd.append('file', payload.file)
  if (payload.remove_photo) fd.append('remove_photo', 'true')
  const res = await apiClient.put(`/api/agents/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteAgent(id: number) {
  const res = await apiClient.delete(`/api/agents/${id}`)
  return res.data
}
