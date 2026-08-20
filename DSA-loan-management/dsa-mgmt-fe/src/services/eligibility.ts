import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse, EligibilityStatus } from '../types'

export interface EligibilityResult {
  applicationId: number
  uniqueCustomerId?: string
  customerName?: string
  email?: string
  mobile?: string
  age?: number
  gender?: string
  location?: string
  employmentType?: string
  productName?: string
  productType?: string
  status: EligibilityStatus
  missingFields?: string[]

  requestedAmount?: number
  eligibleAmount?: number
  proposedEmi?: number
  monthlyIncome?: number
  cibilScore?: number
  interestRatePct?: number
  femaleRebateApplied?: boolean
  tenureYears?: number
  preferredTenure?: number
  foirPct?: number
  ltvPct?: number
  maxAllowedLtvPct?: number

  positiveFactors?: string[]
  reductionNotes?: string[]
  rejections?: string[]

  aiExplanation?: string
}

export const fetchEligibility = async (applicationId: number): Promise<EligibilityResult> => {
  const res = await apiClient.get<ApiResponse<EligibilityResult>>(API_ENDPOINT_NAMES.ELIGIBILITY.EVALUATE, {
    params: { applicationId },
  })
  return res.data?.result ?? res.data
}
