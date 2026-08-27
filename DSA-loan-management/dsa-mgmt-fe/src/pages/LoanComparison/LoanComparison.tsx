import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBankComparison, BankComparisonResponse } from '../../services/comparison'
import { fetchBanks, Bank } from '../../services/banks'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'
import ApplicationDetailModal from '../../components/ApplicationDetailModal'
import {
  BarChartOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  WarningOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { message } from 'antd'
import {
  BankSelectorBar,
  BankComparisonCard,
  AIComparativeAnalysisCard,
} from './components'

const LoanComparison: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const applicationIdParam = searchParams.get('applicationId')
  const initialApplicationId = applicationIdParam ? parseInt(applicationIdParam, 10) : null
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(initialApplicationId)

  // Dropdown states for Bank 1 and Bank 2
  const [bank1Id, setBank1Id] = useState<number | null>(null)
  const [bank2Id, setBank2Id] = useState<number | null>(null)
  const [comparedBankIds, setComparedBankIds] = useState<number[]>([])

  // Fetch applications list to allow application switching
  const { data: applications = [] } = useQuery<LoanApplication[]>({
    queryKey: ['comparison-applications-list', user?.role, user?.id],
    queryFn: () => {
      if (user?.role === 'customer') {
        const identifier = user.mobile || user.email || user.name || ''
        return fetchCustomerLoanApplications(identifier)
      }
      return fetchLoanApplications(user?.role === 'agent' ? user.id : undefined)
    },
  })

  // Fetch all banks for selector
  const { data: allBanks = [] } = useQuery<Bank[]>({
    queryKey: ['banks-list-for-comparison'],
    queryFn: () => fetchBanks(),
  })

  // Auto-select first application or sync when query param changes
  useEffect(() => {
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

  // Set default initial banks when bank list loads
  useEffect(() => {
    if (allBanks.length >= 2 && !bank1Id && !bank2Id) {
      const b1 = allBanks[0].id
      const b2 = allBanks[1].id
      setBank1Id(b1)
      setBank2Id(b2)
      setComparedBankIds([b1, b2])
    } else if (allBanks.length === 1 && !bank1Id) {
      const b1 = allBanks[0].id
      setBank1Id(b1)
      setComparedBankIds([b1])
    }
  }, [allBanks, bank1Id, bank2Id])

  // Fetch comparison data
  const {
    data: comparison,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<BankComparisonResponse>({
    queryKey: ['bank-comparison', selectedApplicationId, comparedBankIds, user?.role],
    queryFn: () =>
      fetchBankComparison(selectedApplicationId!, comparedBankIds, user?.role || 'customer'),
    enabled: !!selectedApplicationId && comparedBankIds.length > 0,
  })

  const qc = useQueryClient()
  const [editingApplication, setEditingApplication] = useState<LoanApplication | null>(null)

  const currentAppObj = applications.find((a) => a.id === selectedApplicationId) || null

  const handleOpenEdit = () => {
    if (currentAppObj) {
      setEditingApplication(currentAppObj)
    } else if (comparison) {
      setEditingApplication({
        id: comparison.applicationId,
        name: comparison.customerName || '',
        uniqueCustomerId: comparison.uniqueCustomerId || '',
      } as any)
    }
  }

  const handleModalUpdated = () => {
    qc.invalidateQueries({ queryKey: ['bank-comparison', selectedApplicationId] })
    qc.invalidateQueries({ queryKey: ['comparison-applications-list'] })
    refetch()
    message.success('Application updated! Re-evaluating bank comparison...')
  }

  const handleSelectApp = (id: number) => {
    setSelectedApplicationId(id)
    setSearchParams({ applicationId: String(id) })
  }

  const handleCompare = () => {
    const ids = [bank1Id, bank2Id].filter((id): id is number => id !== null)
    setComparedBankIds(ids)
  }

  const isUserAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin'

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
              <BarChartOutlined className="text-indigo-600" /> Loan Terms Comparison Matrix
            </h1>
            <p className="text-xs text-slate-500">
              Side-by-side comparison of interest rates, EMIs, and policy document eligibility
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <ReloadOutlined className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Selectors Bar */}
      <BankSelectorBar
        applications={applications}
        selectedApplicationId={selectedApplicationId}
        onSelectApp={handleSelectApp}
        allBanks={allBanks}
        bank1Id={bank1Id}
        bank2Id={bank2Id}
        setBank1Id={setBank1Id}
        setBank2Id={setBank2Id}
        onCompare={handleCompare}
      />

      {/* Comparison Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Calculating comparative underwriting parameters…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 text-sm">
          Failed to load loan comparison. Please ensure an application and bank are selected.
        </div>
      ) : comparison?.status === 'INCOMPLETE_DETAILS' ? (
        /* ── Incomplete Details Warning ── */
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 text-2xl shrink-0">
              <WarningOutlined />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-200 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-900">
                  Incomplete Details
                </span>
                <h3 className="text-lg font-bold text-amber-950">
                  Missing Information for {comparison.customerName || 'Applicant'}
                </h3>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                To evaluate bank policy guidelines, eligibility, and interest rates, the following parameters must be completed:
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {comparison.missingFields?.map((field, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-white/80 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-900"
                  >
                    <span className="text-amber-500 font-bold">•</span> {field}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition active:scale-95 cursor-pointer"
                >
                  <EditOutlined /> Complete Details Now
                </button>
                <button
                  onClick={() => refetch()}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/50 transition cursor-pointer"
                >
                  Refresh Check
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : !comparison || comparison.banks.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          Select banks above to view comparison matrix.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {comparison.banks.map((b) => (
              <BankComparisonCard
                key={b.bankId}
                bank={b}
                isUserAgentOrAdmin={isUserAgentOrAdmin}
              />
            ))}
          </div>

          {/* AI Underwriting Analysis */}
          <AIComparativeAnalysisCard
            analysis={comparison.aiComparativeAnalysis}
            disclaimer={comparison.disclaimer}
          />
        </div>
      )}

      {/* Edit Modal */}
      {editingApplication && (
        <ApplicationDetailModal
          application={editingApplication}
          onClose={() => setEditingApplication(null)}
          onUpdated={handleModalUpdated}
        />
      )}
    </div>
  )
}

export default LoanComparison
