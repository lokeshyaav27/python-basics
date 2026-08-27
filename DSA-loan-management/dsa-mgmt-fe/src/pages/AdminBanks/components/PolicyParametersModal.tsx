import React, { useState, useEffect } from 'react'
import { Modal, message, Spin, Tabs } from 'antd'
import {
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  PercentageOutlined,
  DollarOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import {
  BankPolicyParameters,
  fetchPolicyParameters,
  savePolicyParameters,
  extractPolicyParameters,
} from '../../../services/banks'

interface PolicyParametersModalProps {
  visible: boolean
  bankId: number
  productId: number
  bankName: string
  productName: string
  initialData?: BankPolicyParameters | null
  onClose: () => void
  onSaved: () => void
}

export const PolicyParametersModal: React.FC<PolicyParametersModalProps> = ({
  visible,
  bankId,
  productId,
  bankName,
  productName,
  initialData,
  onClose,
  onSaved,
}) => {
  const [params, setParams] = useState<BankPolicyParameters>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)

  useEffect(() => {
    if (visible) {
      if (initialData && Object.keys(initialData).length > 0) {
        setParams(initialData)
      } else {
        loadParameters()
      }
    }
  }, [visible, bankId, productId, initialData])

  const loadParameters = async () => {
    setLoading(true)
    try {
      const data = await fetchPolicyParameters(bankId, productId)
      setParams(data || {})
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to load policy parameters')
    } finally {
      setLoading(false)
    }
  }

  const handleReExtract = async () => {
    setExtracting(true)
    try {
      const data = await extractPolicyParameters(bankId, productId)
      setParams(data || {})
      message.success('Policy parameters extracted from documents successfully!')
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to extract policy with AI')
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePolicyParameters(bankId, productId, params)
      message.success(`Policy rules approved and saved for ${bankName}!`)
      onSaved()
      onClose()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to save policy parameters')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof BankPolicyParameters, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={780}
      title={
        <div className="flex items-center gap-2 text-slate-800 text-base font-bold pb-2 border-b border-slate-100">
          <SafetyCertificateOutlined className="text-indigo-600 text-lg" />
          <span>Underwriting Policy Review & Human-in-the-Loop Approval</span>
        </div>
      }
      footer={[
        <button
          key="reextract"
          type="button"
          disabled={extracting || saving}
          onClick={handleReExtract}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition cursor-pointer float-left"
          title="Re-run AI extraction against uploaded PDF documents"
        >
          <ThunderboltOutlined className={extracting ? 'animate-spin' : ''} />
          {extracting ? 'Extracting via AI…' : 'Re-extract with AI'}
        </button>,
        <button
          key="cancel"
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer mr-2"
        >
          Cancel
        </button>,
        <button
          key="save"
          type="button"
          disabled={saving || loading || extracting}
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
        >
          <SaveOutlined /> {saving ? 'Saving…' : 'Approve & Save Policy'}
        </button>,
      ]}
    >
      <div className="py-2">
        {/* Bank & Scheme Header */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4">
          <div>
            <div className="text-xs text-slate-500 font-medium">Bank & Loan Product</div>
            <div className="text-sm font-bold text-slate-800">
              {bankName} <span className="text-slate-400 font-normal">›</span> {productName}
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
            AI-Assisted Policy Verification
          </span>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-900 leading-relaxed">
          <InfoCircleOutlined className="text-blue-600 mt-0.5" />
          <div>
            Review the extracted underwriting parameters below. Modify any values if necessary to match the bank's exact lending circular before approving.
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Spin size="large" />
            <div className="text-xs text-slate-500 mt-3 font-medium">Loading bank policy rules…</div>
          </div>
        ) : (
          <Tabs
            defaultActiveKey="roi"
            items={[
              {
                key: 'roi',
                label: (
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <PercentageOutlined /> Interest Rate (ROI)
                  </span>
                ),
                children: (
                  <div className="grid grid-cols-2 gap-3.5 py-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CIBIL ≥ 750 Interest Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.roi_tier_1_cibil_750_plus ?? ''}
                        onChange={(e) => updateField('roi_tier_1_cibil_750_plus', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 7.35"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CIBIL 700 – 749 Interest Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.roi_tier_2_cibil_700_749 ?? ''}
                        onChange={(e) => updateField('roi_tier_2_cibil_700_749', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 7.65"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CIBIL 650 – 699 Interest Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.roi_tier_3_cibil_650_699 ?? ''}
                        onChange={(e) => updateField('roi_tier_3_cibil_650_699', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 8.10"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CIBIL &lt; 650 Interest Rate (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.roi_tier_4_cibil_below_650 ?? ''}
                        onChange={(e) => updateField('roi_tier_4_cibil_below_650', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 8.75"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                        Female Co-Applicant Concession (% Rebate)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.female_rebate_pct ?? ''}
                        onChange={(e) => updateField('female_rebate_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 0.05"
                        className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Absolute Minimum ROI Floor (% p.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.min_roi_floor ?? ''}
                        onChange={(e) => updateField('min_roi_floor', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 6.50"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'fees',
                label: (
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <DollarOutlined /> Fees & Insurance
                  </span>
                ),
                children: (
                  <div className="grid grid-cols-2 gap-3.5 py-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Processing Fee (% of Loan Amount)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.processing_fee_pct ?? ''}
                        onChange={(e) => updateField('processing_fee_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 0.50"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Min / Max Processing Fee Cap (₹)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={params.min_processing_fee ?? ''}
                          onChange={(e) => updateField('min_processing_fee', parseFloat(e.target.value) || 0)}
                          placeholder="Min (e.g. 5000)"
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          value={params.max_processing_fee ?? ''}
                          onChange={(e) => updateField('max_processing_fee', parseFloat(e.target.value) || 0)}
                          placeholder="Max (e.g. 25000)"
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Property Insurance (% of Loan Amount)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.property_insurance_pct ?? ''}
                        onChange={(e) => updateField('property_insurance_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 0.10"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Applicant Life Insurance (% of Loan Amount)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.applicant_insurance_pct ?? ''}
                        onChange={(e) => updateField('applicant_insurance_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 0.50"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'ltv',
                label: (
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <HomeOutlined /> LTV & Collateral
                  </span>
                ),
                children: (
                  <div className="grid grid-cols-2 gap-3.5 py-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Ready-to-Move Property Max LTV (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={params.ltv_ready_pct ?? ''}
                        onChange={(e) => updateField('ltv_ready_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 80.0"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Under-Construction Property Max LTV (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={params.ltv_under_construction_pct ?? ''}
                        onChange={(e) => updateField('ltv_under_construction_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 80.0"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Flat / Apartment Max LTV (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={params.ltv_flat_pct ?? ''}
                        onChange={(e) => updateField('ltv_flat_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 60.0"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Standard Collateral Max LTV (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={params.ltv_standard_pct ?? ''}
                        onChange={(e) => updateField('ltv_standard_pct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 75.0"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'eligibility',
                label: (
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <ClockCircleOutlined /> Tenure & Eligibility
                  </span>
                ),
                children: (
                  <div className="grid grid-cols-2 gap-3.5 py-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Minimum CIBIL Score Required
                      </label>
                      <input
                        type="number"
                        value={params.min_cibil ?? ''}
                        onChange={(e) => updateField('min_cibil', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 650"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Maximum Loan Tenure (Years)
                      </label>
                      <input
                        type="number"
                        value={params.max_tenure_years ?? ''}
                        onChange={(e) => updateField('max_tenure_years', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 30"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Max Maturity Age (Salaried Borrowers)
                      </label>
                      <input
                        type="number"
                        value={params.max_maturity_age_salaried ?? ''}
                        onChange={(e) => updateField('max_maturity_age_salaried', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 60"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Max Maturity Age (Self-Employed Borrowers)
                      </label>
                      <input
                        type="number"
                        value={params.max_maturity_age_self_employed ?? ''}
                        onChange={(e) => updateField('max_maturity_age_self_employed', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 65"
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </Modal>
  )
}

export default PolicyParametersModal
