import apiClient from './apiClient'
import { API_ENDPOINT_NAMES } from '../constants/apiEndpoints'
import { ApiResponse } from '../types/api'

export interface InsuranceItem {
  isProvided: string
  percentage?: number
  amount?: number
  description?: string
}

export interface BankComparisonItem {
  bankId: number
  bankName: string
  bankLogo?: string
  isPrivate: boolean
  isNationalize: boolean
  isNbfc: boolean
  
  isLinked: boolean
  hasPolicyDocs: boolean
  policyStatusNote?: string
  
  status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE' | 'N/A'
  reasonForRejection: string[]
  
  roi?: number
  baseRoi?: number
  loanAmount?: number
  requestedAmount?: number
  emi?: number
  tenure?: string
  tenureYears?: number
  
  benefitForFemaleCoApplicant?: string
  femaleRebateApplied: boolean
  
  propertyInsurance?: InsuranceItem
  applicantInsurance?: InsuranceItem
  
  processingFee?: string
  dsaCommission?: string
  commissionPct?: number
  commissionAmount?: number
  
  additionalNote?: string
  policyExcerpts: string[]
}

export interface BankComparisonResponse {
  applicationId: number
  uniqueCustomerId?: string
  customerName?: string
  productName?: string
  productType?: string
  requestedAmount?: number
  cibilScore?: number
  monthlyIncome?: number
  
  banks: BankComparisonItem[]
  aiComparativeAnalysis?: string
  disclaimer: string
}

export const fetchBankComparison = async (
  applicationId: number,
  bankIds: number[],
  userRole: string = 'customer'
): Promise<BankComparisonResponse> => {
  const res = await apiClient.get<ApiResponse<BankComparisonResponse>>(API_ENDPOINT_NAMES.COMPARISON.BANKS, {
    params: {
      applicationId,
      bankIds: bankIds.join(','),
      userRole,
    },
  })
  return res.data?.result ?? res.data
}
