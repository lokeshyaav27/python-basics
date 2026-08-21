import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '../../constants/routes'
import {
  fetchLoanApplications,
  createLoanApplication,
  updateLoanApplication,
  deleteLoanApplication,
  assignLoanApplicationAgent,
  LoanApplication,
} from '../../services/loanApplications'
import { fetchAgents } from '../../services/agents'
import { fetchProducts } from '../../services/products'
import { message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ApplicationDetailModal from '../../components/ApplicationDetailModal'
import {
  AssignAgentModal,
  LoanApplicationFormModal,
  DeleteLoanModal,
  ApplicationsTable,
} from './components'

const AdminLoanApplications: React.FC = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: applications = [], isLoading: isApplicationsLoading } = useQuery<LoanApplication[]>({
    queryKey: ['admin-loan-applications'],
    queryFn: () => fetchLoanApplications(),
  })

  const { data: agents = [] } = useQuery({
    queryKey: ['admin-agents-dropdown'],
    queryFn: fetchAgents,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-dropdown'],
    queryFn: fetchProducts,
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [active, setActive] = useState<LoanApplication | null>(null)
  const [detailModalApp, setDetailModalApp] = useState<LoanApplication | null>(null)
  const [assignModal, setAssignModal] = useState<{ open: boolean; app: LoanApplication | null }>({
    open: false,
    app: null,
  })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({
    open: false,
  })

  // Mutations
  const createMut = useMutation({
    mutationFn: createLoanApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Loan application created successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to create application'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      updateLoanApplication(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Loan application updated successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to update application'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteLoanApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Application deleted')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to delete application'),
  })

  const assignMut = useMutation({
    mutationFn: ({ id, agentId }: { id: number; agentId: number | null }) =>
      assignLoanApplicationAgent(id, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })
      message.success('Agent assigned successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to assign agent'),
  })

  const handleAssign = async (agentId: number | null) => {
    if (!assignModal.app) return
    await assignMut.mutateAsync({ id: assignModal.app.id, agentId })
  }

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">All Loan Applications</h2>
          <p className="text-sm text-slate-500">
            Monitor incoming loan inquiries, assign DSA agents, and track bank forwarding status
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(ROUTES.ADMIN.CHAT_WITH_AI)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition"
          >
            🤖 AI Underwriter Assistant
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <PlusOutlined /> New Application
          </button>
        </div>
      </div>

      {/* Table */}
      <ApplicationsTable
        applications={applications}
        isLoading={isApplicationsLoading}
        onViewDetails={(app) => setDetailModalApp(app)}
        onAssignAgent={(app) => setAssignModal({ open: true, app })}
        onEdit={(app) => {
          setActive(app)
          setShowEdit(true)
        }}
        onDelete={(id) => setConfirmDelete({ open: true, id })}
      />

      {/* Detail Modal */}
      {detailModalApp && (
        <ApplicationDetailModal
          application={detailModalApp}
          onClose={() => setDetailModalApp(null)}
          onUpdated={() => qc.invalidateQueries({ queryKey: ['admin-loan-applications'] })}
          canEdit={true}
        />
      )}

      {/* Assign Agent Modal */}
      {assignModal.open && assignModal.app && (
        <AssignAgentModal
          application={assignModal.app}
          agents={agents}
          onClose={() => setAssignModal({ open: false, app: null })}
          onAssign={handleAssign}
        />
      )}

      {/* Add Application Modal */}
      {showAdd && (
        <LoanApplicationFormModal
          title="New Loan Application"
          products={products}
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            await createMut.mutateAsync(data)
          }}
        />
      )}

      {/* Edit Application Modal */}
      {showEdit && active && (
        <LoanApplicationFormModal
          title="Edit Loan Application"
          initialData={active}
          products={products}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => {
            await updateMut.mutateAsync({ id: active.id, payload: data })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteLoanModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default AdminLoanApplications
