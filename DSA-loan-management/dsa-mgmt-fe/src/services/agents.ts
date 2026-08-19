import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'

export const fetchAgents = async () => {
  const res = await apiClient.get(API_ENDPOINT_NAMES.AGENTS.BASE)
  return res.data || []
}

export const createAgent = async (payload: {
  name: string
  email: string
  mobile: string
  password: string
  isAdmin?: boolean
  file?: File | null
}) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('email', payload.email)
  fd.append('mobile', payload.mobile)
  fd.append('password', payload.password)
  fd.append('isAdmin', String(!!payload.isAdmin))
  if (payload.file) fd.append('file', payload.file)
  const res = await apiClient.post(API_ENDPOINT_NAMES.AGENTS.BASE, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const updateAgent = async (
  id: number,
  payload: {
    name: string
    email: string
    mobile: string
    isAdmin?: boolean
    file?: File | null
    remove_photo?: boolean
  }
) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('email', payload.email)
  fd.append('mobile', payload.mobile)
  fd.append('isAdmin', String(!!payload.isAdmin))
  if (payload.file) fd.append('file', payload.file)
  if (payload.remove_photo) fd.append('remove_photo', 'true')
  const res = await apiClient.put(API_ENDPOINT_NAMES.AGENTS.BY_ID(id), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const deleteAgent = async (id: number) => {
  const res = await apiClient.delete(API_ENDPOINT_NAMES.AGENTS.BY_ID(id))
  return res.data
}
