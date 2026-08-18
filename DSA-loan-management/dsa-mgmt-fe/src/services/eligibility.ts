import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export interface EligibilityResult {
  applicationId: number
  uniqueCustomerId?: string
  customerName?: string
  productName?: string
  productType?: string
  status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE' | 'INCOMPLETE_DETAILS' | 'ERROR'
  isComplete: boolean
  message?: string
  missingFields: string[]

  requestedAmount?: number
  eligibleAmount?: number
  proposedEmi?: number
  interestRatePct?: number
  baseInterestRatePct?: number
  femaleRebateApplied?: boolean
  tenureYears?: number
  foirPct?: number
  maxAllowedFoirPct?: number
  ltvPct?: number
  maxAllowedLtvPct?: number
  propertyValue?: number
  carValue?: number
  monthlyIncome?: number
  existingEmi?: number
  monthlyObligation?: number
  cibilScore?: number

  rejections: string[]
  positiveFactors: string[]
  reductionNotes: string[]

  aiExplanation?: string
  applicantData?: Record<string, any>
}

export async function fetchEligibility(applicationId: number): Promise<EligibilityResult> {
  const res = await axios.get<EligibilityResult>(`${API_BASE_URL}/api/eligibility/evaluate`, {
    params: { applicationId },
  })
  return res.data
}
