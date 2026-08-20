import React from 'react'
import { CloseOutlined, CheckCircleFilled } from '@ant-design/icons'
import { API_BASE_URL } from '../../../constants'
import { Product } from './ProductFormModal'

interface ProductViewModalProps {
  product: Product | null
  onClose: () => void
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({ product, onClose }) => {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💳</span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Product Details</h3>
              <p className="text-xs text-slate-400 font-mono">ID #{product.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <CloseOutlined className="text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
            {/* Left: Image / Visual Card */}
            <div className="md:col-span-2">
              {product.image ? (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-inner">
                  <img
                    src={`${API_BASE_URL}/static/product-images/${product.image}`}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 flex flex-col items-center justify-center text-blue-700 gap-2">
                  <span className="text-4xl">💳</span>
                  <span className="text-xs font-bold text-blue-800">No Image Uploaded</span>
                </div>
              )}
            </div>

            {/* Right: Product Info & Meta */}
            <div className="md:col-span-3 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircleFilled className="text-xs" /> Active Loan Scheme
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Category #{product.id}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Product Description & Guidelines
                </label>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                  {product.description || 'No detailed description provided for this loan scheme.'}
                </div>
              </div>
            </div>
          </div>

          {/* System Capabilities Section */}
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>⚡</span> Integrated Platform Capabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100/80 shadow-2xs">
                <span className="text-blue-600">📊</span>
                <span className="font-semibold text-slate-700">Deterministic FOIR / LTV Engine</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100/80 shadow-2xs">
                <span className="text-indigo-600">⚖️</span>
                <span className="font-semibold text-slate-700">Multi-Bank Offer Comparison</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100/80 shadow-2xs">
                <span className="text-emerald-600">🤖</span>
                <span className="font-semibold text-slate-700">RAG Vector Policy Search</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductViewModal
