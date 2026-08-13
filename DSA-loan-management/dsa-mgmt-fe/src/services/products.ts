import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function fetchProducts() {
  const res = await axios.get(`${API_BASE_URL}/api/products`)
  return res.data || []
}

export async function createProduct(payload: { name: string; description: string; file: File }) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('description', payload.description)
  fd.append('file', payload.file)
  const res = await axios.post(`${API_BASE_URL}/api/products`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function updateProduct(id: number, payload: { name: string; description: string; file?: File | null }) {
  const fd = new FormData()
  fd.append('name', payload.name)
  fd.append('description', payload.description)
  if (payload.file) fd.append('file', payload.file)
  if ((payload as any).remove_image) fd.append('remove_image', 'true')
  const res = await axios.put(`${API_BASE_URL}/api/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function deleteProduct(id: number) {
  const res = await axios.delete(`${API_BASE_URL}/api/products/${id}`)
  return res.data
}
export async function deleteProductImage(filename: string) {
  const res = await axios.delete(`${API_BASE_URL}/api/files/product-image/${filename}`)
  return res.data
}
