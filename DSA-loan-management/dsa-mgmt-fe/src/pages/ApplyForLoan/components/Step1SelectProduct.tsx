import React from 'react'
import { API_BASE_URL } from '../../../constants'

interface Step1SelectProductProps {
  products: any[]
  isLoadingProducts: boolean
  selectedProductId: number | null
  setSelectedProductId: (id: number) => void
  onNext: () => void
}

export const Step1SelectProduct: React.FC<Step1SelectProductProps> = ({
  products,
  isLoadingProducts,
  selectedProductId,
  setSelectedProductId,
  onNext,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Step 1: Choose Loan Product</h2>
        <p className="text-xs text-slate-500 mt-1">
          Select the loan category that best suits your financial requirement
        </p>
      </div>

      {isLoadingProducts ? (
        <div className="py-12 text-center text-slate-400">Loading loan products…</div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-slate-400">No active products available.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => {
            const isSelected = selectedProductId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProductId(p.id)}
                className={`relative rounded-3xl p-5 text-left transition duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {p.image ? (
                      <img
                        src={`${API_BASE_URL}/static/product-images/${p.image}`}
                        alt={p.name}
                        className="h-12 w-12 rounded-2xl object-cover border border-slate-100 p-1 bg-white"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-xl font-bold">
                        💳
                      </div>
                    )}
                    <span
                      className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                  <span>Fast Disbursal</span>
                  <span>Instant Match →</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedProductId}
          className="rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-40 transition active:scale-95"
        >
          Continue to Contact Details →
        </button>
      </div>
    </div>
  )
}

export default Step1SelectProduct
