import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { fetchBankProducts, BankProductLink } from '../../../services/banks'
import { BankLogo, BoolBadge } from './BankLogo'
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

  const linkedCount = products.filter((p) => p.isLinked).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 bg-slate-50/80">
          <div className="flex items-center gap-4">
            <BankLogo logo={bank.logo} name={bank.name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">Link Products & Policies — {bank.name}</h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {linkedCount} of {products.length} Linked
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure loan product eligibility, DSA payout commission rates, and upload bank underwriting policy documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <CloseOutlined className="text-base" />
          </button>
        </div>

        {/* Modal Body / Table */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading products & bank linkages…</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No active loan products available to link.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full table-auto">
                <thead className="bg-slate-50/90 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-16">
                      Link
                    </th>
                    <th className="p-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-80">
                      Loan Product
                    </th>
                    <th className="p-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-48">
                      DSA Payout Commission (%)
                    </th>
                    <th className="p-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Policy Guidelines (PDF / DOC)
                    </th>
                    <th className="p-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-32">
                      Action
                    </th>
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
                        qc.invalidateQueries({ queryKey: ['bank-products-view', bank.id] })
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-8 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <InfoCircleOutlined className="text-blue-500 text-sm" />
            <span>
              Check the box for products offered by this bank. Upload underwriting policies for the RAG AI search engine.
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-7 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkProductsModal
