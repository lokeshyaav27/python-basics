import React from 'react'
import { API_BASE_URL } from '../../../constants'
import { Product } from './ProductFormModal'

interface ProductViewModalProps {
  product: Product | null
  onClose: () => void
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({ product, onClose }) => {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
        {product.image ? (
          <img
            src={`${API_BASE_URL}/static/product-images/${product.image}`}
            alt={product.name}
            className="h-28 w-full rounded-2xl object-cover border"
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center mx-auto">
            💳
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
          <span className="text-xs font-semibold text-slate-400 font-mono">Product ID: #{product.id}</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          {product.description}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductViewModal
