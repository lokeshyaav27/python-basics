import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function fetchProducts() {
  const res = await axios.get(`${API_BASE_URL}/api/products`)
  return res.data || []
}

export async function createProduct(payload: { name: string; description: string; image?: string }) {
  const res = await axios.post(`${API_BASE_URL}/api/products`, payload)
  return res.data
}

export async function updateProduct(id: number, payload: { name: string; description: string; image?: string }) {
  const res = await axios.put(`${API_BASE_URL}/api/products/${id}`, payload)
  return res.data
}

export async function deleteProduct(id: number) {
  const res = await axios.delete(`${API_BASE_URL}/api/products/${id}`)
  return res.data
}

export async function uploadProductImage(file: File, productId?: number) {
  const fd = new FormData()
  fd.append('file', file)
  if (productId) fd.append('product_id', String(productId))
  const res = await axios.post(`${API_BASE_URL}/api/files/product-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function deleteProductImage(filename: string) {
  const res = await axios.delete(`${API_BASE_URL}/api/files/product-image/${filename}`)
  return res.data
}
