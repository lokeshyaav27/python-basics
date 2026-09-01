import React, { useState } from 'react'
import {
  CalculatorOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  PieChartOutlined,
} from '@ant-design/icons'

interface FoirLtvExplainerSectionProps {
  eligibility: any
  productName?: string
  clientGeneralDetails?: any
  homeLoanDetails?: any
  carLoanDetails?: any
  personalLoanDetails?: any
}

export const FoirLtvExplainerSection: React.FC<FoirLtvExplainerSectionProps> = ({
  eligibility,
  productName = 'Loan',
  clientGeneralDetails,
  homeLoanDetails,
  carLoanDetails,
  personalLoanDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'foir' | 'ltv'>('foir')

  if (!eligibility || eligibility.status === 'INCOMPLETE_DETAILS') {
    return null
  }

  // Extract financial variables
  const monthlyIncome = Number(
    eligibility.monthlyIncome || clientGeneralDetails?.monthly_income || 0
  )
  const existingEmi = Number(clientGeneralDetails?.existing_emi || 0)
  const monthlyObligation = Number(clientGeneralDetails?.monthly_obligation || 0)
  
  // Calculate or resolve requested loan EMI (which is the proposed new loan EMI evaluated under FOIR)
  let proposedEmi = Number(eligibility.requestedEmi || eligibility.proposedEmi || 0)
  if (
    proposedEmi <= 0 &&
    Number(eligibility.requestedAmount || 0) > 0 &&
    Number(eligibility.interestRatePct || 0) > 0 &&
    Number(eligibility.tenureYears || 0) > 0
  ) {
    const P = Number(eligibility.requestedAmount)
    const r = (Number(eligibility.interestRatePct) / 100) / 12
    const n = Number(eligibility.tenureYears) * 12
    const factor = Math.pow(1 + r, n)
    proposedEmi = Math.round((P * r * factor) / (factor - 1))
  }

  const totalMonthlyOutflow = existingEmi + monthlyObligation + proposedEmi
  const foirPct = Number(eligibility.foirPct || 0)
  const remainingDisposable = Math.max(0, monthlyIncome - totalMonthlyOutflow)

  // Extract LTV variables
  const isHomeLoan = productName.toLowerCase().includes('home') || productName.toLowerCase().includes('housing')
  const isCarLoan = productName.toLowerCase().includes('car') || productName.toLowerCase().includes('vehicle')
  const propertyValue = Number(
    homeLoanDetails?.property_value || carLoanDetails?.car_value || 0
  )
  const requestedLoan = Number(eligibility.requestedAmount || 0)
  const ltvPct = Number(eligibility.ltvPct || 0)
  const maxAllowedLtv = Number(eligibility.maxAllowedLtvPct || (isHomeLoan ? 75 : 85))
  const maxLtvCapAmount = (propertyValue * maxAllowedLtv) / 100

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-200/60">
              <CalculatorOutlined />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Underwriting Math & Formula Breakdown
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              Live Application Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            See exactly how FOIR (debt capacity) and LTV (collateral risk) were calculated for this borrower.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('foir')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'foir'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartOutlined /> 1. FOIR Ratio ({foirPct.toFixed(1)}%)
          </button>
          {(isHomeLoan || isCarLoan) && (
            <button
              type="button"
              onClick={() => setActiveTab('ltv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ltv'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HomeOutlined /> 2. LTV Ratio ({ltvPct.toFixed(1)}%)
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: FOIR BREAKDOWN ──────────────────────────────────────── */}
      {activeTab === 'foir' && (
        <div className="space-y-6">
          {/* Plain English Definition Banner */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-4 text-xs text-blue-950 flex items-start gap-3">
            <InfoCircleOutlined className="text-blue-600 text-sm mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-blue-900">What is FOIR (Fixed Obligation to Income Ratio)?</span>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                FOIR calculates what percentage of an applicant's monthly salary is already committed to recurring expenses and debt payments. Banks use FOIR to ensure a borrower does not take on more debt than they can comfortably afford.
              </p>
            </div>
          </div>

          {/* Formula Visual Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
              Human-Readable Formula
            </span>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center py-2">
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-2xs font-mono font-bold text-slate-800 text-xs sm:text-sm">
                FOIR (%)
              </div>
              <span className="text-lg font-black text-slate-400">=</span>
              <div className="flex flex-col items-center">
                <div className="border-b-2 border-slate-400 pb-1 px-3 text-xs sm:text-sm font-bold text-slate-800">
                  Total Monthly Outflows (Existing EMIs + Living Obligations + New Loan EMI)
                </div>
                <div className="pt-1 px-3 text-xs sm:text-sm font-bold text-teal-700">
                  Gross Monthly Net Income
                </div>
              </div>
              <span className="text-lg font-black text-slate-400">×</span>
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-2xs font-mono font-bold text-slate-800 text-xs sm:text-sm">
                100
              </div>
            </div>
          </div>

          {/* Application Numbers Step-by-Step */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Step 1: Monthly Inflow
                </span>
                <span className="text-xs text-slate-400">Salary</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Gross Net Monthly Income</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹ {monthlyIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                The total verified take-home earnings available to service living costs and debt.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Step 2: Monthly Outflow
                </span>
                <span className="text-xs text-slate-400">Expenses</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Existing Ongoing EMIs:</span>
                  <span className="font-semibold">₹ {existingEmi.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Living / Household Obligations:</span>
                  <span className="font-semibold">₹ {monthlyObligation.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Proposed New Loan EMI:</span>
                  <span>₹ {proposedEmi.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-extrabold text-slate-900 text-sm">
                  <span>Total Monthly Outflow:</span>
                  <span>₹ {totalMonthlyOutflow.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Step 3: FOIR Ratio
                </span>
                <span className="text-xs text-slate-400">Final Metric</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  (₹ {totalMonthlyOutflow.toLocaleString('en-IN')} / ₹ {monthlyIncome.toLocaleString('en-IN')}) × 100
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-2xl font-black ${
                      foirPct <= 50
                        ? 'text-emerald-700'
                        : foirPct <= 65
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {foirPct.toFixed(1)}%
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {foirPct <= 50 ? '🟢 Normal' : foirPct <= 65 ? '🟡 High' : '🔴 Exceeded'}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-700">Remaining Pocket Money:</span>{' '}
                <span className="font-extrabold text-slate-900">
                  ₹ {remainingDisposable.toLocaleString('en-IN')}/mo
                </span>{' '}
                ({((remainingDisposable / (monthlyIncome || 1)) * 100).toFixed(1)}% left)
              </div>
            </div>
          </div>

          {/* Underwriting Threshold Guide */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-xs">
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">
              Banking FOIR Policy Guidelines
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                <CheckCircleOutlined className="text-emerald-600 text-sm mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 block">≤ 50% (Prime / Safe)</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    100% of requested loan amount is approved without hair-cut or reduction.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                <WarningOutlined className="text-amber-600 text-sm mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block">50% – 65% (Marginal Tier)</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Loan is approved with scaled-down amount (10% - 30% reduction applied).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                <CloseCircleOutlined className="text-rose-600 text-sm mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-rose-900 block">&gt; 65% (Overburdened)</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Automatic ineligibility / rejection. Debt load poses high default risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LTV BREAKDOWN ──────────────────────────────────────── */}
      {activeTab === 'ltv' && (isHomeLoan || isCarLoan) && (
        <div className="space-y-6">
          {/* Definition Banner */}
          <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 text-xs text-indigo-950 flex items-start gap-3">
            <InfoCircleOutlined className="text-indigo-600 text-sm mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-indigo-900">What is LTV (Loan-to-Value Ratio)?</span>
              <p className="mt-0.5 text-indigo-800 leading-relaxed">
                LTV measures the proportion of the property or vehicle price that the bank finances versus what the borrower pays upfront as a down payment. Lower LTV means higher borrower equity and lower risk for the lender.
              </p>
            </div>
          </div>

          {/* Formula Visual Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
              Human-Readable Formula
            </span>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center py-2">
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-2xs font-mono font-bold text-slate-800 text-xs sm:text-sm">
                LTV (%)
              </div>
              <span className="text-lg font-black text-slate-400">=</span>
              <div className="flex flex-col items-center">
                <div className="border-b-2 border-slate-400 pb-1 px-3 text-xs sm:text-sm font-bold text-slate-800">
                  Requested Principal Loan Amount
                </div>
                <div className="pt-1 px-3 text-xs sm:text-sm font-bold text-indigo-700">
                  Asset Valuation (Property Market Value / Vehicle Quotation)
                </div>
              </div>
              <span className="text-lg font-black text-slate-400">×</span>
              <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-2xs font-mono font-bold text-slate-800 text-xs sm:text-sm">
                100
              </div>
            </div>
          </div>

          {/* Numbers Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Asset Valuation
              </span>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  {isHomeLoan ? 'Property Market Value' : 'Vehicle Quotation Price'}
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹ {propertyValue.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Independent appraisal or showroom quotation of the underlying collateral.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Requested Funding
              </span>
              <div>
                <span className="text-[11px] text-slate-500 block">Requested Loan Amount</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹ {requestedLoan.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Borrower Down Payment: <span className="font-bold text-slate-800">₹ {Math.max(0, propertyValue - requestedLoan).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Calculated LTV
              </span>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  (₹ {requestedLoan.toLocaleString('en-IN')} / ₹ {propertyValue.toLocaleString('en-IN')}) × 100
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-2xl font-black ${
                      ltvPct <= maxAllowedLtv ? 'text-indigo-700' : 'text-rose-600'
                    }`}
                  >
                    {ltvPct.toFixed(1)}%
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Max Allowed: {maxAllowedLtv}%
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-100">
                Max Allowed Lending Cap: <span className="font-extrabold text-slate-900">₹ {maxLtvCapAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FoirLtvExplainerSection
