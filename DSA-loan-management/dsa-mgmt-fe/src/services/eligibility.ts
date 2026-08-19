import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

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

export const fetchEligibility = async (applicationId: number): Promise<EligibilityResult> => {
  const res = await apiClient.get<ApiResponse<EligibilityResult>>(API_ENDPOINT_NAMES.ELIGIBILITY.EVALUATE, {
    params: { applicationId },
  })
  return res.data?.result ?? res.data
}
