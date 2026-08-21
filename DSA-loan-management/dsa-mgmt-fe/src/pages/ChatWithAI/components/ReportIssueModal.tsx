import React, { useState } from 'react'
import { Modal, Select, Input, Alert } from 'antd'
import { FlagOutlined, RobotOutlined, WarningOutlined } from '@ant-design/icons'
import { DisplayChatMessage } from './ChatMessageBubble'

interface ReportIssueModalProps {
  open: boolean
  onClose: () => void
  targetMessage: DisplayChatMessage | null
  userPromptText?: string
  onSubmitReport: (payload: {
    issueCategory: string
    userRemarks: string
    reportedAssistantMsg: DisplayChatMessage
  }) => Promise<void>
  isSubmitting: boolean
}

const ISSUE_CATEGORIES = [
  { value: 'INACCURATE_CALCULATION', label: '🧮 Inaccurate Calculation (EMI, FOIR, LTV, Eligibility)' },
  { value: 'POLICY_MISMATCH', label: '🏦 Bank Policy / Age / Salary Criteria Mismatch' },
  { value: 'INSUFFICIENT_ANSWER', label: '⚠️ Incomplete, Vague, or Insufficient Explanation' },
  { value: 'HALLUCINATION', label: '🚫 Hallucinated or Non-Existent Guidelines' },
  { value: 'OUTDATED_RATES', label: '📉 Outdated Interest Rates or Processing Fees' },
  { value: 'OTHER', label: '📝 Other Underwriting / Quality Concern' },
]

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  open,
  onClose,
  targetMessage,
  userPromptText,
  onSubmitReport,
  isSubmitting,
}) => {
  const [category, setCategory] = useState<string>('INACCURATE_CALCULATION')
  const [remarks, setRemarks] = useState<string>('')

  const handleConfirm = async () => {
    if (!targetMessage) return
    await onSubmitReport({
      issueCategory: category,
      userRemarks: remarks.trim(),
      reportedAssistantMsg: targetMessage,
    })
    setRemarks('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleConfirm}
      okText={isSubmitting ? 'Analyzing & Recording...' : 'Submit Issue Report'}
      cancelText="Cancel"
      confirmLoading={isSubmitting}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-rose-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 text-sm">
            <FlagOutlined />
          </span>
          Report AI Response Quality Issue
        </div>
      }
      centered
      width={560}
      okButtonProps={{
        className: 'bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl',
      }}
      cancelButtonProps={{
        className: 'rounded-xl',
      }}
    >
      <div className="space-y-4 py-2 text-xs">
        <Alert
          type="info"
          showIcon
          message="AI Quality Diagnostic"
          description="Your report will be automatically analyzed against platform underwriting documents by our AI Auditor and forwarded to credit risk administrators."
          className="rounded-2xl border-purple-200 bg-purple-50/70 text-purple-900"
        />

        {/* Flagged Interaction Preview */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          {userPromptText && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your Query
              </div>
              <div className="text-xs font-medium text-slate-800 line-clamp-2">
                "{userPromptText}"
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
              <RobotOutlined /> Flagged AI Assistant Response
            </div>
            <div className="text-xs text-slate-600 line-clamp-3 bg-white p-2 rounded-xl border border-slate-200/80 mt-1 font-mono text-[11px]">
              {targetMessage?.content?.slice(0, 300)}...
            </div>
          </div>
        </div>

        {/* Issue Category */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Issue Category <span className="text-rose-500">*</span>
          </label>
          <Select
            value={category}
            onChange={(val) => setCategory(val)}
            options={ISSUE_CATEGORIES}
            className="w-full"
            size="large"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Additional Remarks / What went wrong? <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <Input.TextArea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Expected HDFC max tenure 30 yrs with 8.4% ROI, but assistant computed 20 yrs with 9.2%..."
            rows={3}
            className="rounded-xl"
            maxLength={1000}
            showCount
          />
        </div>
      </div>
    </Modal>
  )
}

export default ReportIssueModal
