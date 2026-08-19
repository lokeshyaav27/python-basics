import React from 'react'
import { Tooltip } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { Bank, BankLogo, BoolBadge } from './BankLogo'

interface BanksTableProps {
  banks: Bank[]
  isLoading: boolean
  onLinkProducts: (bank: Bank) => void
  onView: (bank: Bank) => void
  onEdit: (bank: Bank) => void
  onDelete: (id: number) => void
}

export const BanksTable: React.FC<BanksTableProps> = ({
  banks,
  isLoading,
  onLinkProducts,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full table-auto">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bank / Institution
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nationalized
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Private
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              NBFC
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-sm text-slate-400">
                Loading banks…
              </td>
            </tr>
          ) : banks.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-sm text-slate-400">
                No banks found.
              </td>
            </tr>
          ) : (
            banks.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <BankLogo logo={b.logo} name={b.name} size="md" />
                    <div>
                      <span className="block text-sm font-semibold text-slate-800">{b.name}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">ID: #{b.id}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <BoolBadge value={b.isNationalize} activeLabel="Nationalized" activeColor="emerald" />
                </td>
                <td className="p-3">
                  <BoolBadge value={b.isPrivate} activeLabel="Private" activeColor="blue" />
                </td>
                <td className="p-3">
                  <BoolBadge value={b.isnbfc} activeLabel="NBFC" activeColor="purple" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <Tooltip title="Link Products & Documents">
                      <button
                        onClick={() => onLinkProducts(b)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                        aria-label="Link Products"
                      >
                        <LinkOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title="View Bank Details">
                      <button
                        onClick={() => onView(b)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                        aria-label="View Details"
                      >
                        <EyeOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title="Edit Bank">
                      <button
                        onClick={() => onEdit(b)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                        aria-label="Edit Bank"
                      >
                        <EditOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title="Delete Bank">
                      <button
                        onClick={() => onDelete(b.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                        aria-label="Delete Bank"
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
  )
}

export default BanksTable
