import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEligibility, EligibilityResult } from '../services/eligibility'
import {
  fetchLoanApplications,
  fetchCustomerLoanApplications,
  LoanApplication,
} from '../services/loanApplications'
import { useAuth } from '../auth/AuthProvider'
import ApplicationDetailModal from '../components/ApplicationDetailModal'
import {
  AuditOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  RobotOutlined,
  EditOutlined,
  ReloadOutlined,
  RightOutlined,
  BarChartOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'
import { Tooltip, message } from 'antd'
import { ROUTES } from '../constants/routes'

const CheckEligibility: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const appIdParam = searchParams.get('appId')
  const initialAppId = appIdParam ? parseInt(appIdParam, 10) : null
  const [selectedAppId, setSelectedAppId] = useState<number | null>(initialAppId)
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

  // Set default selected application if not in query param
  React.useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      const firstId = applications[0].id
      setSelectedAppId(firstId)
      setSearchParams({ appId: String(firstId) })
    }
  }, [applications, selectedAppId, setSearchParams])

  // Fetch eligibility evaluation
  const {
    data: eligibility,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<EligibilityResult>({
    queryKey: ['loan-eligibility', selectedAppId],
    queryFn: () => fetchEligibility(selectedAppId!),
    enabled: !!selectedAppId,
  })

  const handleSelectApp = (id: number) => {
    setSelectedAppId(id)
    setSearchParams({ appId: String(id) })
  }

  // Find full application object for modal editing
  const currentAppObj = applications.find((a) => a.id === selectedAppId) || null

  const handleOpenEdit = () => {
    if (currentAppObj) {
      setEditingApplication(currentAppObj)
    } else if (eligibility) {
      // Fallback mock object if not in list
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
    qc.invalidateQueries({ queryKey: ['loan-eligibility', selectedAppId] })
    qc.invalidateQueries({ queryKey: ['eligibility-applications-list'] })
    refetch()
    message.success('Application updated! Re-evaluating eligibility...')
  }

  const isHomeLoan = (eligibility?.productType || '').toLowerCase().includes('home')
  const isCarLoan = (eligibility?.productType || '').toLowerCase().includes('car')

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
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700 text-lg border border-teal-200/60 shadow-2xs">
                <AuditOutlined />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Loan Eligibility Check</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rule-based underwriting engine evaluating CIBIL, FOIR, LTV, and debt capacity
            </p>
          </div>
        </div>

        {/* Application Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 hidden sm:block">Application:</label>
          <select
            value={selectedAppId || ''}
            onChange={(e) => handleSelectApp(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 shadow-2xs"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                #{app.id} — {app.name} ({app.productName || 'Loan'})
              </option>
            ))}
          </select>

          <Tooltip title="Re-evaluate Eligibility">
            <button
              onClick={() => refetch()}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
            >
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-3xl text-teal-600 animate-pulse">
            <CalculatorOutlined />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">Evaluating Loan Eligibility...</h3>
          <p className="mt-1 text-xs text-slate-500">
            Applying DSA underwriting rules, CIBIL matrices, and debt obligations...
          </p>
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-2xl text-rose-600">
            <CloseCircleOutlined />
          </div>
          <h3 className="mt-3 text-base font-bold text-rose-900">Failed to Evaluate Eligibility</h3>
          <p className="mt-1 text-xs text-rose-700">
            {(error as any)?.response?.data?.detail || 'An unexpected error occurred while processing application data.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Incomplete Details Warning ─────────────────────────────────── */}
      {eligibility && eligibility.status === 'INCOMPLETE_DETAILS' && (
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
                  Missing Information for {eligibility.customerName || 'Applicant'}
                </h3>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                To calculate precise loan eligibility, FOIR ratios, and interest rates, the following parameters must be completed:
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {eligibility.missingFields.map((field, idx) => (
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
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition active:scale-95"
                >
                  <EditOutlined /> Complete Details Now
                </button>
                <button
                  onClick={() => refetch()}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/50 transition"
                >
                  Refresh Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Evaluation Result Card ────────────────────────────────── */}
      {eligibility && eligibility.status !== 'INCOMPLETE_DETAILS' && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-sm transition ${
              eligibility.status === 'ELIGIBLE'
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50'
                : eligibility.status === 'PARTIALLY_ELIGIBLE'
                ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/50'
                : 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/50'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl shrink-0 shadow-xs ${
                    eligibility.status === 'ELIGIBLE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : eligibility.status === 'PARTIALLY_ELIGIBLE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {eligibility.status === 'ELIGIBLE' ? (
                    <CheckCircleOutlined />
                  ) : eligibility.status === 'PARTIALLY_ELIGIBLE' ? (
                    <ExclamationCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${
                        eligibility.status === 'ELIGIBLE'
                          ? 'bg-emerald-200 text-emerald-900'
                          : eligibility.status === 'PARTIALLY_ELIGIBLE'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {eligibility.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      App #{eligibility.applicationId} • {eligibility.productName}
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {eligibility.status === 'ELIGIBLE'
                      ? 'Congratulations! Full Loan Eligibility Approved'
                      : eligibility.status === 'PARTIALLY_ELIGIBLE'
                      ? 'Partially Eligible — Approved with Adjusted Loan Limit'
                      : 'Application Does Not Meet Current Eligibility Thresholds'}
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    Applicant: <span className="font-bold text-slate-800">{eligibility.customerName}</span> | Gross
                    Income: <span className="font-semibold">₹{eligibility.monthlyIncome?.toLocaleString('en-IN')}/mo</span> | CIBIL: <span className="font-semibold">{eligibility.cibilScore}</span>
                  </p>
                </div>
              </div>

              {/* Amount Comparison Highlight */}
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs shrink-0">
                <div className="text-right">
                  <div className="text-[11px] font-medium text-slate-400">Requested</div>
                  <div className="text-sm font-bold text-slate-600">
                    ₹{eligibility.requestedAmount?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Eligible Amount</div>
                  <div className="text-2xl font-black text-slate-900">
                    ₹{eligibility.eligibleAmount?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Underwriting Metrics Grid ──────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* FOIR Gauge */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">FOIR Ratio</span>
                <span
                  className={`text-xs font-extrabold rounded-md px-1.5 py-0.5 ${
                    (eligibility.foirPct || 0) <= 50
                      ? 'bg-emerald-100 text-emerald-800'
                      : (eligibility.foirPct || 0) <= 65
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {(eligibility.foirPct || 0) <= 50 ? 'Normal' : (eligibility.foirPct || 0) <= 65 ? 'Reduced' : 'Exceeded'}
                </span>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-800">
                {eligibility.foirPct?.toFixed(1)}%
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (eligibility.foirPct || 0) <= 50
                      ? 'bg-emerald-500'
                      : (eligibility.foirPct || 0) <= 65
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (eligibility.foirPct || 0))}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0%</span>
                <span>Cap: 65%</span>
              </div>
            </div>

            {/* Proposed Monthly EMI */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Proposed EMI</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-800">
                ₹{eligibility.proposedEmi?.toLocaleString('en-IN') || '0'}
                <span className="text-xs font-medium text-slate-400">/mo</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                For {eligibility.tenureYears} yrs @ {eligibility.interestRatePct}% p.a.
              </p>
            </div>

            {/* Interest Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Applicable ROI</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-800">
                {eligibility.interestRatePct}% <span className="text-xs font-medium text-slate-400">p.a.</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                {eligibility.femaleRebateApplied ? (
                  <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                    ✨ 0.50% Female Rebate
                  </span>
                ) : (
                  <span>Based on CIBIL {eligibility.cibilScore}</span>
                )}
              </div>
            </div>

            {/* LTV or Max Tenure */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {isHomeLoan || isCarLoan ? 'Collateral LTV' : 'Max Tenure'}
              </span>
              <div className="mt-2 text-2xl font-extrabold text-slate-800">
                {isHomeLoan || isCarLoan ? (
                  `${eligibility.ltvPct || 0}%`
                ) : (
                  `${eligibility.tenureYears} Years`
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {isHomeLoan || isCarLoan
                  ? `Max Allowed: ${eligibility.maxAllowedLtvPct || 0}%`
                  : 'Unsecured Personal Loan'}
              </p>
            </div>
          </div>

          {/* ── AI Underwriter Explanation (Groq openai/gpt-oss-120b) ───── */}
          {eligibility.aiExplanation && (
            <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white text-sm">
                    <RobotOutlined />
                  </span>
                  <h4 className="text-sm font-bold text-blue-950">AI Underwriting Insights</h4>
                  <span className="rounded-full bg-blue-200/80 px-2 py-0.5 text-[10px] font-mono text-blue-900">
                    Groq • openai/gpt-oss-120b
                  </span>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-xs text-blue-900 leading-relaxed font-sans whitespace-pre-line">
                {eligibility.aiExplanation}
              </div>
            </div>
          )}

          {/* ── Detailed Underwriting Lists (Strengths, Reductions, Rejections) ─ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive Factors */}
            {eligibility.positiveFactors && eligibility.positiveFactors.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                  <CheckCircleOutlined className="text-emerald-600 text-sm" /> Qualifying Strengths
                </h4>
                <ul className="space-y-2">
                  {eligibility.positiveFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-emerald-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Policy Reductions or Conditions */}
            {eligibility.reductionNotes && eligibility.reductionNotes.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
                  <WarningOutlined className="text-amber-600 text-sm" /> Policy Adjustments & Conditions
                </h4>
                <ul className="space-y-2">
                  {eligibility.reductionNotes.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                      <span className="text-amber-500 font-bold">⚠️</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rejection Causes */}
            {eligibility.rejections && eligibility.rejections.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs md:col-span-2">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 mb-3">
                  <CloseCircleOutlined className="text-rose-600 text-sm" /> Ineligibility Reasons
                </h4>
                <ul className="space-y-2">
                  {eligibility.rejections.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-rose-900">
                      <span className="text-rose-500 font-bold">✕</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Footer Actions ─────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <EditOutlined /> Edit Applicant Details
              </button>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <ReloadOutlined /> Re-evaluate
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  navigate(
                    user?.role === 'customer'
                      ? `${ROUTES.CUSTOMER.LOAN_COMPARISON}?appId=${selectedAppId}`
                      : `${ROUTES.AGENT.LOAN_COMPARISON}?appId=${selectedAppId}`
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition active:scale-95"
              >
                <BarChartOutlined /> Compare Bank Offers <RightOutlined className="text-[10px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Application Detail Modal for Editing ───────────────────────── */}
      {editingApplication && (
        <ApplicationDetailModal
          application={editingApplication}
          canEdit={true}
          onClose={() => setEditingApplication(null)}
          onUpdated={handleModalUpdated}
        />
      )}
    </div>
  )
}

export default CheckEligibility
