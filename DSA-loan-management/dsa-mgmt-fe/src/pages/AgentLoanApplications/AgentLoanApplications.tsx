import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchLoanApplications,
  updateLoanApplicationStatus,
  LoanApplication,
} from '../../services/loanApplications'
import { fetchBanks } from '../../services/banks'
import { useAuth } from '../../auth/AuthProvider'
import { message } from 'antd'
import ApplicationDetailModal from '../../components/ApplicationDetailModal'
import { ROUTES } from '../../constants'
import {
  ApproveBankModal,
  RejectApplicationModal,
  AgentApplicationsTable,
} from './components'

const AgentLoanApplications: React.FC = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: applications = [], isLoading } = useQuery<LoanApplication[]>({
    queryKey: ['agent-loan-applications', user?.id],
    queryFn: () => fetchLoanApplications(user?.id),
    enabled: !!user?.id,
  })

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ['banks-list-agent'],
    queryFn: () => fetchBanks(),
  })

  const [approveModal, setApproveModal] = useState<{ open: boolean; app: LoanApplication | null }>({
    open: false,
    app: null,
  })
  const [rejectModal, setRejectModal] = useState<{ open: boolean; app: LoanApplication | null }>({
    open: false,
    app: null,
  })
  const [detailModalApp, setDetailModalApp] = useState<LoanApplication | null>(null)

  // Status mutation
  const statusMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: { status: string; bankId?: number | null; description?: string }
    }) => updateLoanApplicationStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-loan-applications'] })
      message.success('Application status updated successfully')
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.detail || 'Failed to update application status'),
  })

  const handleApprove = async (bankId: number, description: string) => {
    if (!approveModal.app) return
    await statusMut.mutateAsync({
      id: approveModal.app.id,
      payload: { status: 'approved', bankId, description },
    })
  }

  const handleReject = async (description: string) => {
    if (!rejectModal.app) return
    await statusMut.mutateAsync({
      id: rejectModal.app.id,
      payload: { status: 'rejected', description },
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Assigned Loan Applications</h2>
          <p className="text-sm text-slate-500">
            Review applicant financial metrics, evaluate partner bank eligibility, and forward approved dossiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(ROUTES.AGENT.CHAT_WITH_AI)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition"
          >
            🤖 AI Underwriter Assistant
          </button>
        </div>
      </div>

      {/* Table */}
      <AgentApplicationsTable
        applications={applications}
        isLoading={isLoading}
        onViewDetails={(app) => setDetailModalApp(app)}
        onApprove={(app) => setApproveModal({ open: true, app })}
        onReject={(app) => setRejectModal({ open: true, app })}
      />

      {/* Detail Modal */}
      {detailModalApp && (
        <ApplicationDetailModal
          application={detailModalApp}
          onClose={() => setDetailModalApp(null)}
          onUpdated={() => qc.invalidateQueries({ queryKey: ['agent-loan-applications'] })}
          canEdit={true}
        />
      )}

      {/* Approve Modal */}
      {approveModal.open && approveModal.app && (
        <ApproveBankModal
          application={approveModal.app}
          banks={banks}
          onClose={() => setApproveModal({ open: false, app: null })}
          onApprove={handleApprove}
        />
      )}

      {/* Reject Modal */}
      {rejectModal.open && rejectModal.app && (
        <RejectApplicationModal
          application={rejectModal.app}
          onClose={() => setRejectModal({ open: false, app: null })}
          onReject={handleReject}
        />
      )}
    </div>
  )
}

export default AgentLoanApplications
