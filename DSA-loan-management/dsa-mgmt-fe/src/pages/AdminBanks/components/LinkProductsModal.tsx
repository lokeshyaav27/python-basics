import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBankProducts, BankProductLink } from '../../../services/banks'
import { BankLogo } from './BankLogo'
import { Bank } from './BankFormModal'
import { ProductLinkRow } from './ProductLinkRow'

interface LinkProductsModalProps {
  bank: Bank
  onClose: () => void
}

export const LinkProductsModal: React.FC<LinkProductsModalProps> = ({ bank, onClose }) => {
  const qc = useQueryClient()
  const { data: products = [], isLoading, refetch } = useQuery<BankProductLink[]>({
    queryKey: ['bank-products', bank.id],
    queryFn: () => fetchBankProducts(bank.id),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <BankLogo logo={bank.logo} name={bank.name} size="md" />
            <div>
              <h3 className="text-lg font-bold text-slate-800">Link Products — {bank.name}</h3>
              <p className="text-xs text-slate-500">
                Configure loan products, DSA payout commission rates, and bank policy documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-xl leading-none transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading products & bank linkages…</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No active products available to link.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full table-auto">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-14">Link</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-44">Commission for DSA (%)</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Policy Document</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <ProductLinkRow
                      key={p.productId}
                      bankId={bank.id}
                      item={p}
                      onUpdated={() => {
                        qc.invalidateQueries({ queryKey: ['bank-products', bank.id] })
                        refetch()
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="text-xs text-slate-500">
            ℹ️ Check the box for products offered by this bank. Upload policy guidelines (PDF/DOC) for agent reference.
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkProductsModal
