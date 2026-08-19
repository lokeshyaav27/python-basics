import apiClient from './apiClient'

export const fetchProducts = async () => {
  const res = await apiClient.get('/api/products')
  return res.data || []
}

export const createProduct = async (payload: { name: string; description: string; file: File }) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('description', payload.description)
  fd.append('file', payload.file)
  const res = await apiClient.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export const updateProduct = async (id: number, payload: { name: string; description: string; file?: File | null }) => {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('description', payload.description)
  if (payload.file) fd.append('file', payload.file)
  if ((payload as any).remove_image) fd.append('remove_image', 'true')
  const res = await apiClient.put(`/api/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export const deleteProduct = async (id: number) => {
  const res = await apiClient.delete(`/api/products/${id}`)
  return res.data
}
