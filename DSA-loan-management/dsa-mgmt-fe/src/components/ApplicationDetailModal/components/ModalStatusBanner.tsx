import React from 'react'
import { LoanApplication } from '../../../services/loanApplications'
import { API_BASE_URL } from '../../../constants'

interface ModalStatusBannerProps {
  application: LoanApplication
  isEditing: boolean
  onDiscardEdits: () => void
}

export const ModalStatusBanner: React.FC<ModalStatusBannerProps> = ({
  application,
  isEditing,
  onDiscardEdits,
}) => {
  return (
    <>
      {application.status === 'approved' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-3">
            {application.bankLogo ? (
              <img
                src={`${API_BASE_URL}/static/bank-logo-images/${application.bankLogo}`}
                alt={application.bankName || 'Bank'}
                className="h-10 w-10 rounded-xl object-contain bg-white border border-emerald-200 p-1"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                🏦
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Approved & Forwarded to {application.bankName || 'Partner Bank'}
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {application.description || 'Application forwarded to partner bank for processing.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {application.status === 'rejected' && application.description && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
          <div className="text-xs font-bold text-rose-900 mb-0.5">Decision Remarks:</div>
          <p className="text-xs text-rose-700">{application.description}</p>
        </div>
      )}

      {isEditing && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✏️</span>
            <span>
              <strong>Edit Mode Active:</strong> You can edit customer general details and product requirements below.
            </span>
          </div>
          <button
            type="button"
            onClick={onDiscardEdits}
            className="text-xs font-bold text-amber-900 underline hover:no-underline"
          >
            Discard Edits
          </button>
        </div>
      )}
    </>
  )
}

export default ModalStatusBanner
