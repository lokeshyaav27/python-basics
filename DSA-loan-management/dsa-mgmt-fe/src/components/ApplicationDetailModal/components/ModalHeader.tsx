import React from 'react'
import { EditOutlined, CloseOutlined } from '@ant-design/icons'
import { StatusBadge } from './StatusBadges'
import { LoanApplication } from '../../../services/loanApplications'
import { API_BASE_URL } from '../../../constants'

interface ModalHeaderProps {
  application: LoanApplication
  productName: string
  allowEditing: boolean
  isEditing: boolean
  onStartEdit: () => void
  onClose: () => void
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  application,
  productName,
  allowEditing,
  isEditing,
  onStartEdit,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/90">
      <div className="flex items-center gap-3">
        {application.productImage ? (
          <img
            src={`${API_BASE_URL}/static/product-images/${application.productImage}`}
            alt={productName}
            className="h-11 w-11 rounded-xl object-cover border border-slate-200 bg-white p-1"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white text-lg font-bold">
            💳
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">{productName}</h3>
            <StatusBadge status={application.status} bankName={application.bankName} />
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Application #{application.id} • Customer: {application.name} ({application.mobile})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {allowEditing && !isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-1.5"
          >
            <EditOutlined /> Edit Details
          </button>
        )}

        <button
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-sm flex items-center justify-center transition"
        >
          <CloseOutlined />
        </button>
      </div>
    </div>
  )
}

export default ModalHeader
