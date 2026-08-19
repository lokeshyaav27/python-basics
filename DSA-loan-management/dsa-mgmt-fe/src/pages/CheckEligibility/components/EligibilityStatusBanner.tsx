import React from 'react'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'

interface EligibilityStatusBannerProps {
  status: string
  summary?: string
}

export const EligibilityStatusBanner: React.FC<EligibilityStatusBannerProps> = ({
  status,
  summary,
}) => {
  const isEligible = status === 'ELIGIBLE'
  const isPartial = status === 'PARTIALLY_ELIGIBLE'

  return (
    <div
      className={`rounded-3xl border p-5 flex items-start gap-4 ${
        isEligible
          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
          : isPartial
          ? 'border-amber-200 bg-amber-50/80 text-amber-900'
          : 'border-rose-200 bg-rose-50/80 text-rose-900'
      }`}
    >
      <div className="text-2xl mt-0.5">
        {isEligible ? (
          <CheckCircleOutlined className="text-emerald-600" />
        ) : isPartial ? (
          <ExclamationCircleOutlined className="text-amber-600" />
        ) : (
          <CloseCircleOutlined className="text-rose-600" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold">
          {isEligible
            ? 'Profile Fully Eligible for Multiple Partner Banks'
            : isPartial
            ? 'Partially Eligible — Specific Conditions Apply'
            : 'Eligibility Criteria Not Met'}
        </h3>
        <p className="text-xs leading-relaxed opacity-90">
          {summary || 'Review individual partner bank assessments below.'}
        </p>
      </div>
    </div>
  )
}

export default EligibilityStatusBanner
