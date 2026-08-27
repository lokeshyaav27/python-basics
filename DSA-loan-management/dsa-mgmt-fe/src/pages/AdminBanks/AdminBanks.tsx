import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchBanks,
  createBank,
  updateBank,
  deleteBank,
} from '../../services/banks'
import { message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  Bank,
  BankFormModal,
  BankViewModal,
  LinkProductsModal,
  DeleteBankModal,
  BanksTable,
} from './components'

const AdminBanks: React.FC = () => {
  const qc = useQueryClient()
  const { data: banks = [], isLoading } = useQuery<Bank[]>({
    queryKey: ['admin-banks'],
    queryFn: () => fetchBanks(),
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({
    open: false,
  })
  const [active, setActive] = useState<Bank | null>(null)
  const [linkModal, setLinkModal] = useState<{ open: boolean; bank: Bank | null }>({
    open: false,
    bank: null,
  })

  // Mutations
  const createMut = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      message.success('Bank added successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to add bank'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateBank(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      message.success('Bank updated successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to update bank'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBank,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      message.success('Bank deleted')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to delete bank'),
  })

  const handleAddSubmit = async (formData: any) => {
    await createMut.mutateAsync(formData)
  }

  const handleEditSubmit = async (formData: any) => {
    if (!active) return
    await updateMut.mutateAsync({ id: active.id, payload: formData })
  }

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Banks & Lending Partners</h2>
          <p className="text-sm text-slate-500">
            Manage partner banks, financial institutions, and product linkages
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <PlusOutlined /> Add Bank
        </button>
      </div>

      {/* Table */}
      <BanksTable
        banks={banks}
        isLoading={isLoading}
        onLinkProducts={(b) => setLinkModal({ open: true, bank: b })}
        onView={(b) => {
          setActive(b)
          setShowView(true)
        }}
        onEdit={(b) => {
          setActive(b)
          setShowEdit(true)
        }}
        onDelete={(id) => setConfirmDelete({ open: true, id })}
      />

      {/* Link Products Modal */}
      {linkModal.open && linkModal.bank && (
        <LinkProductsModal
          bank={linkModal.bank}
          onClose={() => setLinkModal({ open: false, bank: null })}
        />
      )}

      {/* Add Bank Modal */}
      {showAdd && (
        <BankFormModal
          title="Add Bank"
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* Edit Bank Modal */}
      {showEdit && active && (
        <BankFormModal
          title="Edit Bank"
          initialData={active}
          onClose={() => setShowEdit(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* View Bank Modal */}
      {showView && active && (
        <BankViewModal
          bank={active}
          onClose={() => setShowView(false)}
          onOpenLink={() => {
            setShowView(false)
            setLinkModal({ open: true, bank: active })
          }}
        />
      )}

      {/* Delete Bank Modal */}
      <DeleteBankModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default AdminBanks
