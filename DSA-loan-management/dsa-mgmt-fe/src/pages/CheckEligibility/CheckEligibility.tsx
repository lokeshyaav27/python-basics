import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEligibility, EligibilityResult } from '../../services/eligibility'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'
import ApplicationDetailModal from '../../components/ApplicationDetailModal'
import {
  AuditOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  ApplicantSummaryCard,
  EligibilityStatusBanner,
  BankEligibilityCard,
  AIEligibilityInsightsCard,
} from './components'

const CheckEligibility: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const applicationIdParam = searchParams.get('applicationId')
  const initialApplicationId = applicationIdParam ? parseInt(applicationIdParam, 10) : null
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(initialApplicationId)
  const [editingApplication, setEditingApplication] = useState<LoanApplication | null>(null)

  // Fetch applications list to allow quick switching
  const { data: applications = [] } = useQuery<LoanApplication[]>({
    queryKey: ['eligibility-applications-list', user?.role, user?.id],
    queryFn: () => {
      if (user?.role === 'customer') {
        const identifier = user.mobile || user.email || user.name || ''
        return fetchCustomerLoanApplications(identifier)
      }
      return fetchLoanApplications(user?.role === 'agent' ? user.id : undefined)
    },
  })

  // Set default selected application or sync when query param changes
  React.useEffect(() => {
    const currentParam = searchParams.get('applicationId')
    if (currentParam) {
      const parsed = parseInt(currentParam, 10)
      if (!isNaN(parsed) && parsed !== selectedApplicationId) {
        setSelectedApplicationId(parsed)
      }
    } else if (!selectedApplicationId && applications.length > 0) {
      const firstId = applications[0].id
      setSelectedApplicationId(firstId)
      setSearchParams({ applicationId: String(firstId) })
    }
  }, [searchParams, applications, selectedApplicationId, setSearchParams])

  // Fetch eligibility evaluation
  const {
    data: eligibility,
    isLoading,
    isError,
    refetch,
  } = useQuery<EligibilityResult>({
    queryKey: ['loan-eligibility', selectedApplicationId],
    queryFn: () => fetchEligibility(selectedApplicationId!),
    enabled: !!selectedApplicationId,
  })

  const handleSelectApp = (id: number) => {
    setSelectedApplicationId(id)
    setSearchParams({ applicationId: String(id) })
  }

  // Find full application object for modal editing
  const currentAppObj = applications.find((a) => a.id === selectedApplicationId) || null

  const handleOpenEdit = () => {
    if (currentAppObj) {
      setEditingApplication(currentAppObj)
    } else if (eligibility) {
      setEditingApplication({
        id: eligibility.applicationId,
        name: eligibility.customerName || '',
        email: eligibility.applicantData?.email || '',
        mobile: eligibility.applicantData?.mobile || '',
        uniqueCustomerId: eligibility.uniqueCustomerId || '',
      } as any)
    }
  }

  const handleModalUpdated = () => {
    qc.invalidateQueries({ queryKey: ['loan-eligibility', selectedApplicationId] })
    qc.invalidateQueries({ queryKey: ['eligibility-applications-list'] })
    refetch()
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-2xs transition"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <AuditOutlined className="text-blue-600" /> Automated Underwriting & Eligibility Matrix
            </h1>
            <p className="text-xs text-slate-500">
              Evaluates FOIR, LTV, CIBIL benchmarks, age limits, and partner bank credit policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {applications.length > 1 && (
            <select
              value={selectedApplicationId ?? ''}
              onChange={(e) => handleSelectApp(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  #{app.id} • {app.name || 'Applicant'} ({app.productName || 'Loan'})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <ReloadOutlined /> Refresh
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Assessing credit policy algorithms and banking rules…
        </div>
      ) : isError || !eligibility ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 text-sm">
          Failed to evaluate eligibility for this application. Ensure mandatory financial parameters are filled.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Applicant Parameters Summary */}
          <ApplicantSummaryCard
            eligibility={eligibility}
            onOpenEdit={handleOpenEdit}
          />

          {/* Status Banner */}
          <EligibilityStatusBanner
            status={eligibility.overallStatus}
            summary={eligibility.summary}
          />

          {/* Bank Matrices */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Partner Bank Evaluation Breakdown ({eligibility.banks?.length || 0})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eligibility.banks?.map((bank: any, idx: number) => (
                <BankEligibilityCard key={idx} bank={bank} />
              ))}
            </div>
          </div>

          {/* AI Insights Card */}
          <AIEligibilityInsightsCard
            insights={eligibility.aiInsights}
            disclaimer={eligibility.disclaimer}
          />
        </div>
      )}

      {/* Edit Detail Modal */}
      {editingApplication && (
        <ApplicationDetailModal
          application={editingApplication}
          onClose={() => setEditingApplication(null)}
          onUpdated={handleModalUpdated}
          canEdit={true}
        />
      )}
    </div>
  )
}

export default CheckEligibility
