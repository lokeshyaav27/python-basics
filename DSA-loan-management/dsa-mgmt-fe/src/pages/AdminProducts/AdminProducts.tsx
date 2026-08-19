import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../services/products'
import { message, Tooltip } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '../../constants'
import {
  Product,
  ProductFormModal,
  ProductViewModal,
  DeleteProductModal,
} from './components'

const AdminProducts: React.FC = () => {
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({
    open: false,
  })
  const [active, setActive] = useState<Product | null>(null)

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      message.success('Product created successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to create product'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      message.success('Product updated successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to update product'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      message.success('Product deleted')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to delete product'),
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Loan Products Catalog</h2>
          <p className="text-sm text-slate-500">
            Define available credit products, brochures, and eligibility criteria categories
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <PlusOutlined /> Add Product
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading loan products…</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">No products found.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {p.image ? (
                    <img
                      src={`${API_BASE_URL}/static/product-images/${p.image}`}
                      alt={p.name}
                      className="h-12 w-12 rounded-2xl object-cover border border-slate-100 p-1"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl">
                      💳
                    </div>
                  )}
                  <span className="font-mono text-xs text-slate-400">ID #{p.id}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-600">Active Scheme</span>
                <div className="flex items-center gap-1">
                  <Tooltip title="View Product">
                    <button
                      onClick={() => {
                        setActive(p)
                        setShowView(true)
                      }}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                    >
                      <EyeOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title="Edit Product">
                    <button
                      onClick={() => {
                        setActive(p)
                        setShowEdit(true)
                      }}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-amber-200/70"
                    >
                      <EditOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <button
                      onClick={() => setConfirmDelete({ open: true, id: p.id })}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-rose-200/70"
                    >
                      <DeleteOutlined />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <ProductFormModal
          title="Add New Loan Product"
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            await createMut.mutateAsync(data)
          }}
        />
      )}

      {/* Edit Modal */}
      {showEdit && active && (
        <ProductFormModal
          title="Edit Loan Product"
          initialData={active}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => {
            await updateMut.mutateAsync({ id: active.id, payload: data })
          }}
        />
      )}

      {/* View Modal */}
      {showView && active && (
        <ProductViewModal product={active} onClose={() => setShowView(false)} />
      )}

      {/* Delete Confirmation */}
      <DeleteProductModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={async () => {
          if (confirmDelete.id) {
            await deleteMut.mutateAsync(confirmDelete.id)
            setConfirmDelete({ open: false })
          }
        }}
      />
    </div>
  )
}

export default AdminProducts
