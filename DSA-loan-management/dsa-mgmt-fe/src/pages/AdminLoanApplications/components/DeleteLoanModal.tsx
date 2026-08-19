import React from 'react'

interface DeleteLoanModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteLoanModal: React.FC<DeleteLoanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-xl">
            🗑️
          </span>
          <h3 className="text-lg font-semibold text-slate-800">Delete Application</h3>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Are you sure you want to delete this loan application record? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteLoanModal
