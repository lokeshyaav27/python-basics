import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBankComparison, BankComparisonResponse } from '../../services/comparison'
import { fetchBanks, Bank } from '../../services/banks'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'
import {
  BarChartOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  BankSelectorBar,
  BankComparisonCard,
  AIComparativeAnalysisCard,
} from './components'

const LoanComparison: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const appIdParam = searchParams.get('appId') || searchParams.get('applicationId')
  const initialAppId = appIdParam ? parseInt(appIdParam, 10) : null
  const [selectedAppId, setSelectedAppId] = useState<number | null>(initialAppId)

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
    queryFn: fetchBanks,
  })

  // Auto-select first application or sync when query param changes
  useEffect(() => {
    const currentParam = searchParams.get('appId') || searchParams.get('applicationId')
    if (currentParam) {
      const parsed = parseInt(currentParam, 10)
      if (!isNaN(parsed) && parsed !== selectedAppId) {
        setSelectedAppId(parsed)
      }
    } else if (!selectedAppId && applications.length > 0) {
      const firstId = applications[0].id
      setSelectedAppId(firstId)
      setSearchParams({ appId: String(firstId) })
    }
  }, [searchParams, applications, selectedAppId, setSearchParams])

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
    queryKey: ['bank-comparison', selectedAppId, comparedBankIds, user?.role],
    queryFn: () =>
      fetchBankComparison(selectedAppId!, comparedBankIds, user?.role || 'customer'),
    enabled: !!selectedAppId && comparedBankIds.length > 0,
  })

  const handleSelectApp = (id: number) => {
    setSelectedAppId(id)
    setSearchParams({ appId: String(id) })
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
        selectedAppId={selectedAppId}
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
    </div>
  )
}

export default LoanComparison
