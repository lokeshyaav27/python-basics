import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/products'
import { message, Tooltip } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'

type Product = {
  id: number
  name: string
  description: string
  image?: string
}

const AdminProducts: React.FC = () => {
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ['admin-products'], queryFn: fetchProducts })

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries(['admin-products'])
      message.success('Product created')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to create product')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries(['admin-products'])
      message.success('Product updated')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update product')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-products'])
      message.success('Product deleted')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to delete product')
    },
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [active, setActive] = useState<Product | null>(null)

  const [form, setForm] = useState({ name: '', description: '', image: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  const validateFileSize = (file: File) => {
    const max = 3 * 1024 * 1024
    return file.size <= max
  }

  const validateFileRatio = (file: File) => {
    return new Promise<boolean>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const width = img.width
          const height = img.height
          const ratio = height / width
          const ok = Math.abs(ratio - 2 / 3) < 0.03
          resolve(ok)
        }
        img.onerror = () => resolve(false)
        img.src = String(reader.result)
      }
      reader.onerror = () => resolve(false)
      reader.readAsDataURL(file)
    })
  }

  const openAdd = () => {
    setForm({ name: '', description: '', image: '' })
    setSelectedFile(null)
    setRemoveImage(false)
    setShowAdd(true)
  }

  const openEdit = (p: Product) => {
    setActive(p)
    setForm({ name: p.name, description: p.description, image: p.image || '' })
    setSelectedFile(null)
    setRemoveImage(false)
    setShowEdit(true)
  }

  const [removeImage, setRemoveImage] = useState(false)

  const openView = (p: Product) => {
    setActive(p)
    setShowView(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('image is required')
      return
    }

    if (!validateFileSize(selectedFile)) {
      alert('image must be <= 3MB')
      return
    }

    const okRatio = await validateFileRatio(selectedFile)
    if (!okRatio) {
      alert('image must have 2:3 (height:width) ratio')
      return
    }

    await createMut.mutateAsync({ name: form.name, description: form.description, file: selectedFile as File })
    setShowAdd(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!active) return
    await updateMut.mutateAsync({ id: active.id, payload: { name: form.name, description: form.description, file: selectedFile, remove_image: removeImage } })
    setShowEdit(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-sm text-slate-600">Manage loan products</p>
        </div>
        <div>
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm text-white font-bold hover:bg-blue-700 shadow-sm transition">
            <PlusOutlined /> Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full table-auto">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Description</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-sm text-slate-500">Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-sm text-slate-500">No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50/70 transition">
                  <td className="p-3 text-sm font-semibold text-slate-800">{p.name}</td>
                  <td className="p-3 text-sm text-slate-600">{p.description}</td>
                  <td className="p-3 text-sm text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Tooltip title="View Details">
                        <button
                          onClick={() => openView(p)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="View Details"
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Edit Product">
                        <button
                          onClick={() => openEdit(p)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Edit Product"
                        >
                          <EditOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Product">
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: p.id })}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Delete Product"
                        >
                          <DeleteOutlined />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Add Product</h3>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Image (required)</label>
                <input required type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Edit Product</h3>
            <form onSubmit={handleEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Image (required)</label>
                <div className="flex items-start gap-4">
                  <div>
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                    <div className="text-xs text-slate-500">Choose a file to replace existing image.</div>
                  </div>
                  <div>
                    {form.image ? (
                      <div className="flex flex-col items-start">
                        <img src={`${API_BASE_URL}/static/product-images/${form.image}`} alt="current" className="h-24 object-contain border" />
                        <button type="button" onClick={() => { setRemoveImage(true); setForm({ ...form, image: '' }); setSelectedFile(null); }} className="mt-2 text-sm text-red-600">Remove image</button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No current image</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-yellow-600 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">View Product</h3>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-600">Name</div>
                <div className="text-slate-800">{active.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Description</div>
                <div className="text-slate-800">{active.description}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Image</div>
                {active.image ? (
                  <img src={`${API_BASE_URL}/static/product-images/${active.image}`} alt={active.name} className="mt-2 max-h-64 object-contain" />
                ) : (
                  <div className="text-slate-500">No image</div>
                )}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowView(false)} className="px-4 py-2 rounded border">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Confirm delete</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to delete this product?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete({ open: false })} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts
