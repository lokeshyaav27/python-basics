import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBankComparison, BankComparisonResponse, BankComparisonItem } from '../../services/comparison'
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  RobotOutlined,
  ReloadOutlined,
  AuditOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  FileTextOutlined,
  PercentageOutlined,
} from '@ant-design/icons'
import { Tooltip, message } from 'antd'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function LoanComparison() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const appIdParam = searchParams.get('appId')
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

  // Auto-select first application if none selected
  useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      const firstId = applications[0].id
      setSelectedAppId(firstId)
      setSearchParams({ appId: String(firstId) })
    }
  }, [applications, selectedAppId, setSearchParams])

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
    error,
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

  const handleStartComparison = () => {
    if (!bank1Id && !bank2Id) {
      message.warning('Please select at least one bank to compare.')
      return
    }

    if (bank1Id && bank2Id && bank1Id === bank2Id) {
      message.warning('Please select two distinct banks for comparison.')
      return
    }

    const selectedList: number[] = []
    if (bank1Id) selectedList.push(bank1Id)
    if (bank2Id && bank2Id !== bank1Id) selectedList.push(bank2Id)

    setComparedBankIds(selectedList)
    refetch()
    message.success('Comparison updated!')
  }

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Top Header & Navigation ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition shadow-2xs hover:scale-105 active:scale-95"
            title="Go Back"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-700 text-lg border border-purple-200/60 shadow-2xs">
                <BarChartOutlined />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Compare Partner Banks</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side policy comparison of interest rates, EMIs, insurance, and fees (Max 2 Banks)
            </p>
          </div>
        </div>

        {/* Application Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 hidden sm:block">Application:</label>
          <select
            value={selectedAppId || ''}
            onChange={(e) => handleSelectApp(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 shadow-2xs"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                #{app.id} — {app.name} ({app.productName || 'Loan'})
              </option>
            ))}
          </select>

          <Tooltip title="Re-evaluate Comparison">
            <button
              onClick={() => refetch()}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
            >
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Bank Selector Bar (Two Dropdowns + Compare Button) ──────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BankOutlined className="text-purple-600" /> Select Banks to Compare
            </span>
            <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[11px] font-extrabold">
              Max 2 Banks
            </span>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            Choose two partner banks from the dropdowns below and click Compare
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Dropdown 1: First Bank */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Bank 1 <span className="text-purple-600">*</span>
            </label>
            <div className="relative">
              <select
                value={bank1Id || ''}
                onChange={(e) => setBank1Id(e.target.value ? Number(e.target.value) : null)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs pr-8"
              >
                <option value="">-- Select First Bank --</option>
                {allBanks.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === bank2Id}>
                    {b.name} {b.id === bank2Id ? '(Selected as Bank 2)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Dropdown 2: Second Bank */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Bank 2 <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <select
                value={bank2Id || ''}
                onChange={(e) => setBank2Id(e.target.value ? Number(e.target.value) : null)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs pr-8"
              >
                <option value="">-- Select Second Bank (Optional) --</option>
                {allBanks.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === bank1Id}>
                    {b.name} {b.id === bank1Id ? '(Selected as Bank 1)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Compare Action Button */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleStartComparison}
              disabled={isFetching || (!bank1Id && !bank2Id)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 shadow-md shadow-purple-600/25 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChartOutlined />
              <span>{isFetching ? 'Comparing...' : 'Compare'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-3xl text-purple-600 animate-pulse">
            <BarChartOutlined />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">Retrieving Bank Policy Documents...</h3>
          <p className="mt-1 text-xs text-slate-500">
            Running pgvector vector search on bank policy guidelines, CIBIL matrices, and calculating EMI...
          </p>
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-2xl text-rose-600">
            <CloseCircleOutlined />
          </div>
          <h3 className="mt-3 text-base font-bold text-rose-900">Comparison Failed</h3>
          <p className="mt-1 text-xs text-rose-700">
            {(error as any)?.response?.data?.detail || 'An error occurred while comparing bank offers.'}
          </p>
        </div>
      )}

      {/* ── Main Comparison Matrix ─────────────────────────────────────── */}
      {comparison && !isLoading && (
        <div className="space-y-6">
          {/* Applicant & Context Header Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-purple-100 text-purple-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                  {comparison.productName} Comparison
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  App #{comparison.applicationId} • {comparison.customerName}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Requested Amount: <span className="font-bold text-slate-900">₹{comparison.requestedAmount?.toLocaleString('en-IN')}</span> | Gross Income: <span className="font-semibold">₹{comparison.monthlyIncome?.toLocaleString('en-IN')}/mo</span> | CIBIL: <span className="font-semibold">{comparison.cibilScore}</span>
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  user?.role === 'customer'
                    ? `/customer/check-eligibility?appId=${selectedAppId}`
                    : `/agent/check-eligibility?appId=${selectedAppId}`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs shrink-0"
            >
              <AuditOutlined /> Check Eligibility Score
            </button>
          </div>

          {/* Side-by-Side Bank Cards Grid */}
          <div className={`grid grid-cols-1 ${comparison.banks.length === 2 ? 'md:grid-cols-2' : ''} gap-6`}>
            {comparison.banks.map((bank) => (
              <BankComparisonCard key={bank.bankId} bank={bank} isAgentOrAdmin={isAgentOrAdmin} />
            ))}
          </div>

          {/* ── AI Comparative Analysis Card (Groq openai/gpt-oss-120b) ─── */}
          {comparison.aiComparativeAnalysis && (
            <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white text-sm">
                    <RobotOutlined />
                  </span>
                  <h4 className="text-sm font-bold text-blue-950">AI Comparative Assessment & Recommendation</h4>
                  <span className="rounded-full bg-blue-200/80 px-2 py-0.5 text-[10px] font-mono text-blue-900">
                    Groq • openai/gpt-oss-120b
                  </span>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-xs text-blue-900 leading-relaxed font-sans whitespace-pre-line">
                {comparison.aiComparativeAnalysis}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11px] text-slate-400 italic text-center">
            {comparison.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}

function BankComparisonCard({
  bank,
  isAgentOrAdmin,
}: {
  bank: BankComparisonItem
  isAgentOrAdmin: boolean
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {bank.bankLogo ? (
              <img
                src={`${API_BASE_URL}/api/files/bank-logo-images/${bank.bankLogo}`}
                alt={bank.bankName}
                className="h-10 w-10 object-contain rounded-xl border border-slate-200 bg-white p-1"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700 text-lg">
                <BankOutlined />
              </span>
            )}
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{bank.bankName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {bank.isNationalize
                    ? 'Nationalized Bank'
                    : bank.isPrivate
                    ? 'Private Bank'
                    : bank.isNbfc
                    ? 'NBFC Institution'
                    : 'Partner Bank'}
                </span>
                {bank.isLinked ? (
                  <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200/60">
                    Linked
                  </span>
                ) : (
                  <span className="rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-bold border border-rose-200/60">
                    Not Linked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wide shrink-0 ${
              bank.status === 'ELIGIBLE'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : bank.status === 'PARTIALLY_ELIGIBLE'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : bank.status === 'NOT_ELIGIBLE'
                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {bank.status.replace('_', ' ')}
          </span>
        </div>

        {/* Policy Document Disclosure Banner */}
        {!bank.hasPolicyDocs && bank.isLinked && (
          <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-900">
            <WarningOutlined className="text-amber-600 text-sm mt-0.5 shrink-0" />
            <span>Bank does not disclosed policy so will be shared by bank personal manually or over email</span>
          </div>
        )}

        {!bank.isLinked && (
          <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200/80 p-2.5 text-xs text-rose-900">
            <CloseCircleOutlined className="text-rose-600 text-sm mt-0.5 shrink-0" />
            <span>This bank is not linked with the requested loan product. Points are N/A.</span>
          </div>
        )}
      </div>

      {/* ── Comparison Points List ─────────────────────────────────────── */}
      <div className="p-6 space-y-4 text-xs flex-1">
        {/* Row 1: Interest Rate (ROI) */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Interest Rate (ROI)</span>
          <span className="font-black text-sm text-slate-900">
            {bank.roi ? `${bank.roi}% p.a.` : 'N/A'}
          </span>
        </div>

        {/* Row 2: Eligible Loan Amount */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Max Eligible Amount</span>
          <span className="font-extrabold text-sm text-teal-700">
            {bank.loanAmount ? `₹${bank.loanAmount.toLocaleString('en-IN')}` : bank.status === 'NOT_ELIGIBLE' ? '₹0 (Ineligible)' : 'N/A'}
          </span>
        </div>

        {/* Row 3: Proposed Monthly EMI */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Monthly EMI</span>
          <span className="font-extrabold text-sm text-slate-900">
            {bank.emi ? `₹${bank.emi.toLocaleString('en-IN')}/mo` : 'N/A'}
          </span>
        </div>

        {/* Row 4: Permissible Tenure */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Permissible Tenure</span>
          <span className="font-bold text-slate-800">{bank.tenure || 'N/A'}</span>
        </div>

        {/* Row 5: Female Co-applicant Benefit */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Female Co-applicant Benefit</span>
          <span className="font-semibold text-purple-700 text-right">
            {bank.benefitForFemaleCoApplicant || 'N/A'}
          </span>
        </div>

        {/* Row 6: Property Insurance */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Property Insurance</span>
          <div className="text-right">
            {bank.propertyInsurance ? (
              <div>
                <span className="font-bold text-slate-800">
                  Provided: {bank.propertyInsurance.isProvided}
                </span>
                <span className="block text-[11px] text-slate-500">
                  ₹{bank.propertyInsurance.amount?.toLocaleString('en-IN')} ({bank.propertyInsurance.percentage}%)
                </span>
              </div>
            ) : (
              'N/A'
            )}
          </div>
        </div>

        {/* Row 7: Applicant Insurance */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Applicant Insurance</span>
          <div className="text-right">
            {bank.applicantInsurance ? (
              <div>
                <span className="font-bold text-slate-800">
                  Provided: {bank.applicantInsurance.isProvided}
                </span>
                <span className="block text-[11px] text-slate-500">
                  ₹{bank.applicantInsurance.amount?.toLocaleString('en-IN')} ({bank.applicantInsurance.percentage}%)
                </span>
              </div>
            ) : (
              'N/A'
            )}
          </div>
        </div>

        {/* Row 8: Processing Fee */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="font-semibold text-slate-500">Processing Fee</span>
          <span className="font-semibold text-slate-800 text-right">{bank.processingFee || 'N/A'}</span>
        </div>

        {/* Row 9: DSA Commission (Agent / Admin ONLY) */}
        {isAgentOrAdmin && bank.dsaCommission && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100 bg-amber-50/50 rounded-xl px-2.5">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <PercentageOutlined className="text-amber-600" /> DSA Payout / Commission
            </span>
            <span className="font-black text-amber-950">{bank.dsaCommission}</span>
          </div>
        )}

        {/* Row 10: Reasons for Rejection / Reductions */}
        {bank.reasonForRejection && bank.reasonForRejection.length > 0 && (
          <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 space-y-1.5">
            <span className="font-bold text-rose-900 block uppercase tracking-wider text-[10px]">
              Rejection / Policy Factors:
            </span>
            {bank.reasonForRejection.map((r, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-rose-800 text-[11px]">
                <span className="font-bold">✕</span> <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Row 11: Additional Policy Notes */}
        {bank.additionalNote && (
          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
              Bank Policy Notes:
            </span>
            <p>{bank.additionalNote}</p>
          </div>
        )}
      </div>
    </div>
  )
}
