import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'

export const fetchProducts = async () => {
  const res = await apiClient.get(API_ENDPOINT_NAMES.PRODUCTS.BASE)
  return res.data || []
}

export const createProduct = async (payload: { name: string; description: string; file: File }) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('description', payload.description)
  fd.append('file', payload.file)
  const res = await apiClient.post(API_ENDPOINT_NAMES.PRODUCTS.BASE, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const updateProduct = async (
  id: number,
  payload: { name: string; description: string; file?: File | null }
) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('description', payload.description)
  if (payload.file) fd.append('file', payload.file)
  if ((payload as any).remove_image) fd.append('remove_image', 'true')
  const res = await apiClient.put(API_ENDPOINT_NAMES.PRODUCTS.BY_ID(id), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const deleteProduct = async (id: number) => {
  const res = await apiClient.delete(API_ENDPOINT_NAMES.PRODUCTS.BY_ID(id))
  return res.data
}
