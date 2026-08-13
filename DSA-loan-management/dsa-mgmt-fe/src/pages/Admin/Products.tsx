import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../../services/products'

type Product = {
  id: number
  name: string
  description: string
  image?: string
}

export default function ProductsPage() {
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ['admin-products'], queryFn: fetchProducts })

  const createMut = useMutation({ mutationFn: createProduct, onSuccess: () => qc.invalidateQueries(['admin-products']) })

  const updateMut = useMutation({ mutationFn: ({ id, payload }: any) => updateProduct(id, payload), onSuccess: () => qc.invalidateQueries(['admin-products']) })

  const deleteMut = useMutation({ mutationFn: (id: number) => deleteProduct(id), onSuccess: () => qc.invalidateQueries(['admin-products']) })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [active, setActive] = useState<Product | null>(null)

  const [form, setForm] = useState({ name: '', description: '', image: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  function validateFileSize(file: File) {
    const max = 3 * 1024 * 1024
    return file.size <= max
  }

  function validateFileRatio(file: File) {
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

  function openAdd() {
    setForm({ name: '', description: '', image: '' })
    setShowAdd(true)
  }

  function openEdit(p: Product) {
    setActive(p)
    setForm({ name: p.name, description: p.description, image: p.image || '' })
    setShowEdit(true)
  }

  function openView(p: Product) {
    setActive(p)
    setShowView(true)
  }

  async function handleAdd(e: React.FormEvent) {
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

    const up = await uploadProductImage(selectedFile as File)
    const filename = up.filename
    await createMut.mutateAsync({ name: form.name, description: form.description, image: filename })
    setShowAdd(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    let imageName = form.image
    if (selectedFile) {
      if (!validateFileSize(selectedFile)) {
        alert('image must be <= 3MB')
        return
      }
      const okRatio = await validateFileRatio(selectedFile)
      if (!okRatio) {
        alert('image must have 2:3 (height:width) ratio')
        return
      }
      const up = await uploadProductImage(selectedFile as File, active.id)
      imageName = up.filename
    }

    await updateMut.mutateAsync({ id: active.id, payload: { name: form.name, description: form.description, image: imageName } })
    setShowEdit(false)
  }

  async function handleDelete() {
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
          <button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700">Add Product</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full table-auto">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">ID</th>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Description</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-sm text-slate-500">Loading...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-sm text-slate-500">No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 text-sm text-slate-700">{p.id}</td>
                  <td className="p-3 text-sm text-slate-700">{p.name}</td>
                  <td className="p-3 text-sm text-slate-700">{p.description}</td>
                  <td className="p-3 text-sm text-slate-700">
                    <div className="flex gap-2">
                      <button onClick={() => openView(p)} className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">View</button>
                      <button onClick={() => openEdit(p)} className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200">Edit</button>
                      <button onClick={() => setConfirmDelete({ open: true, id: p.id })} className="px-3 py-1 rounded bg-red-100 hover:bg-red-200">Delete</button>
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
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                <div className="text-xs text-slate-500">Leave empty to keep existing image.</div>
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
