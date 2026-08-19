import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchBankProducts, BankProductLink } from '../../../services/banks'
import { BankLogo, BoolBadge } from './BankLogo'
import { API_BASE_URL } from '../../../constants'
import { Bank } from './BankFormModal'

interface BankViewModalProps {
  bank: Bank
  onClose: () => void
  onOpenLink: () => void
}

export const BankViewModal: React.FC<BankViewModalProps> = ({ bank, onClose, onOpenLink }) => {
  const { data: products = [], isLoading } = useQuery<BankProductLink[]>({
    queryKey: ['bank-products-view', bank.id],
    queryFn: () => fetchBankProducts(bank.id),
  })

  const mappedProducts = products.filter((p) => p.isLinked)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Bank Profile & Mappings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-6">
          {/* Bank Header Info Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <BankLogo logo={bank.logo} name={bank.name} size="lg" />
            <div className="text-center sm:text-left flex-1">
              <h4 className="text-xl font-bold text-slate-800">{bank.name}</h4>
              <div className="text-xs text-slate-400 font-mono mt-0.5">Database ID: #{bank.id}</div>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
                <BoolBadge value={bank.isNationalize} activeLabel="Nationalized Bank" activeColor="emerald" />
                <BoolBadge value={bank.isPrivate} activeLabel="Private Bank" activeColor="blue" />
                <BoolBadge value={bank.isnbfc} activeLabel="NBFC Institution" activeColor="purple" />
              </div>
            </div>
          </div>

          {/* Mapped Products & Policy Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>📋</span> Mapped Products & Documents ({mappedProducts.length})
              </h5>
              <button
                onClick={onOpenLink}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                <span>⚙️</span> Manage Mappings
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                Loading mapped products…
              </div>
            ) : mappedProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <span className="text-2xl mb-1 block">📦</span>
                <p className="text-sm font-semibold text-slate-700">No products mapped yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Link loan products and upload policy documents for this bank.
                </p>
                <button
                  onClick={onOpenLink}
                  className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                >
                  + Link Products Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full table-auto">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-36">DSA Commission</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Policy & Scheme Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {mappedProducts.map((p) => (
                      <tr key={p.productId} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {p.productImage ? (
                              <img
                                src={`${API_BASE_URL}/static/product-images/${p.productImage}`}
                                alt={p.productName}
                                className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                {p.productName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="block text-sm font-semibold text-slate-800">{p.productName}</span>
                              <span className="block text-xs text-slate-400 line-clamp-1 max-w-xs">{p.productDescription}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          {p.commission !== null && p.commission !== undefined ? (
                            <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                              {p.commission}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not configured</span>
                          )}
                        </td>

                        <td className="p-3">
                          {p.documents && p.documents.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {p.documents.map((doc) => (
                                <a
                                  key={doc.id || doc.fileName}
                                  href={`${API_BASE_URL}/static/bank-documents/${doc.fileName}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
                                  title={doc.name}
                                >
                                  <span>📄</span>
                                  <span className="max-w-[180px] truncate">{doc.name}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No documents uploaded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BankViewModal
