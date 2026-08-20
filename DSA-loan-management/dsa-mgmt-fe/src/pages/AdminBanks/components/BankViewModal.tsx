import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CloseOutlined, SettingOutlined, FilePdfOutlined, CheckCircleFilled } from '@ant-design/icons'
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
  const totalDocs = mappedProducts.reduce((acc, p) => acc + (p.documents?.length || 0), 0)
  const commissions = mappedProducts
    .map((p) => p.commission)
    .filter((c): c is number => c !== null && c !== undefined)
  const avgCommission =
    commissions.length > 0
      ? (commissions.reduce((a, b) => a + b, 0) / commissions.length).toFixed(2)
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏦</span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Bank Profile & Configuration</h3>
              <p className="text-xs text-slate-500 font-mono">
                {bank.name} • Database ID #{bank.id}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Bank Summary Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/40 p-6 shadow-2xs">
            <div className="flex items-center gap-4">
              <BankLogo logo={bank.logo} name={bank.name} size="lg" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-2xl font-bold text-slate-900">{bank.name}</h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <CheckCircleFilled className="text-xs" /> Active Partner
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <BoolBadge value={bank.isNationalize} activeLabel="Nationalized Bank" activeColor="emerald" />
                  <BoolBadge value={bank.isPrivate} activeLabel="Private Sector Bank" activeColor="blue" />
                  <BoolBadge value={bank.isnbfc} activeLabel="NBFC Lending Institution" activeColor="purple" />
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-center">
              <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-2xs">
                <span className="text-xs text-slate-400 font-semibold block">Mapped Schemes</span>
                <span className="text-lg font-extrabold text-blue-700">{mappedProducts.length}</span>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-2xs">
                <span className="text-xs text-slate-400 font-semibold block">Avg Payout</span>
                <span className="text-lg font-extrabold text-emerald-700">
                  {avgCommission ? `${avgCommission}%` : '—'}
                </span>
              </div>
              <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-2xs">
                <span className="text-xs text-slate-400 font-semibold block">Policy Docs</span>
                <span className="text-lg font-extrabold text-purple-700">{totalDocs}</span>
              </div>
            </div>
          </div>

          {/* Mapped Products Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>📋</span> Active Loan Schemes & Policy Documents ({mappedProducts.length})
              </h5>
              <button
                onClick={onOpenLink}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
              >
                <SettingOutlined /> Manage Product Links
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-400">
                Loading mapped products and policy documents…
              </div>
            ) : mappedProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
                <span className="text-4xl block">📦</span>
                <div>
                  <p className="text-base font-bold text-slate-800">No loan products linked yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Link loan products to configure commission rates and upload bank underwriting policy documents.
                  </p>
                </div>
                <button
                  onClick={onOpenLink}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  + Link Products Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full table-auto">
                  <thead className="bg-slate-50/90 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-80">
                        Loan Product Scheme
                      </th>
                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-44">
                        DSA Commission Rate
                      </th>
                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Uploaded Policy Guidelines
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mappedProducts.map((p) => (
                      <tr key={p.productId} className="hover:bg-slate-50/80 transition">
                        {/* Product info */}
                        <td className="p-4 align-top">
                          <div className="flex items-start gap-3">
                            {p.productImage ? (
                              <img
                                src={`${API_BASE_URL}/static/product-images/${p.productImage}`}
                                alt={p.productName}
                                className="h-11 w-11 rounded-xl object-cover border border-slate-200 bg-white p-0.5 shadow-2xs"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                                💳
                              </div>
                            )}
                            <div>
                              <span className="block text-sm font-bold text-slate-900">{p.productName}</span>
                              <span className="block text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                                {p.productDescription}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Commission */}
                        <td className="p-4 align-top">
                          {p.commission !== null && p.commission !== undefined ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <span className="text-[10px]">💰</span> {p.commission}% Payout
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not configured</span>
                          )}
                        </td>

                        {/* Documents */}
                        <td className="p-4 align-top">
                          {p.documents && p.documents.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {p.documents.map((doc) => {
                                const docName = doc.documentName || doc.name || 'Document'
                                const docFile = doc.documentLocation || doc.fileName || ''
                                return (
                                  <a
                                    key={doc.id || docFile}
                                    href={`${API_BASE_URL}/static/bank-documents/${docFile}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 transition shadow-2xs"
                                    title={docName}
                                  >
                                    <FilePdfOutlined className="text-rose-500 text-sm" />
                                    <span className="max-w-[220px] truncate">{docName}</span>
                                  </a>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No policy documents attached</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-8 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankViewModal
