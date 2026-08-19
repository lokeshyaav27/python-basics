import apiClient from './apiClient'

export type ClientGeneralDetailsData = {
  name?: string | null
  age?: number | null
  gender?: string | null
  location?: string | null
  employment_type?: string | null
  monthly_income?: number | null
  monthly_obligation?: number | null
  existing_emi?: number | null
  cibil_score?: number | null
  loan_amount_required?: number | null
  preferred_tenure?: number | null
  isSalaried?: boolean
}

export type HomeLoanDetailsData = {
  property_value?: number | null
  property_location?: string | null
  propertyUsageType?: string | null
  down_payment?: number | null
  isPartProperty?: boolean
  propertyRequirement?: string | null
  propertyType?: string | null
  propertyStatus?: string | null
  femaleCoApplicant?: boolean
  propertyInsurance?: boolean
  applicantInsurance?: boolean
}

export type CarLoanDetailsData = {
  new_or_used?: string | null
  car_value?: number | null
  down_payment?: number | null
  vehicle_age?: number | null
}

export type PersonalLoanDetailsData = {
  loan_purpose?: string | null
  other?: string | null
  required_amount?: number | null
  existing_obligations?: number | null
}

export interface LoanApplication {
  id: number
  email: string
  name?: string | null
  mobile?: string | null
  uniqueCustomerId?: string | null
  productId?: number | null
  product_name?: string | null
  product?: { id: number; name: string } | null
  status?: string | null
  bankId?: number | null
  bank_name?: string | null
  bank?: { id: number; name: string } | null
  agentId?: number | null
  agent_name?: string | null
  agent?: { id: number; name: string; email?: string; mobile?: string } | null
  description?: string | null
  clientGeneralDetail?: ClientGeneralDetailsData | null
  homeLoanDetail?: HomeLoanDetailsData | null
  carLoanDetail?: CarLoanDetailsData | null
  personalLoanDetail?: PersonalLoanDetailsData | null
  created_at?: string
  updated_at?: string
}

export type FullLoanApplicationData = {
  name: string
  email: string
  mobile: string
  uniqueCustomerId?: string
  productId: number
  clientGeneralDetails: ClientGeneralDetailsData
  homeLoanDetails?: HomeLoanDetailsData | null
  carLoanDetails?: CarLoanDetailsData | null
  personalLoanDetails?: PersonalLoanDetailsData | null
}

export async function fetchLoanApplications(agentId?: number, mobile?: string): Promise<LoanApplication[]> {
  const params: any = {}
  if (agentId !== undefined && agentId !== null) params.agent_id = agentId
  if (mobile !== undefined && mobile !== null) params.mobile = mobile
  const res = await apiClient.get('/api/loan-applications', { params })
  return res.data || []
}

export async function fetchCustomerLoanApplications(mobile: string): Promise<LoanApplication[]> {
  return fetchLoanApplications(undefined, mobile)
}

export async function assignLoanApplicationAgent(
  applicationId: number,
  agentId: number | null
): Promise<LoanApplication> {
  const res = await apiClient.put(`/api/loan-applications/${applicationId}/assign-agent`, { agentId })
  return res.data
}

export async function updateLoanApplicationStatus(
  applicationId: number,
  payload: { status?: string | null; bankId?: number | null; description?: string | null }
): Promise<LoanApplication> {
  const res = await apiClient.put(`/api/loan-applications/${applicationId}/status`, payload)
  return res.data
}

export async function createLoanApplication(payload: any): Promise<LoanApplication> {
  const res = await apiClient.post('/api/loan-applications', payload)
  return res.data
}

export async function updateLoanApplication(
  id: number,
  payload: Partial<FullLoanApplicationData>
): Promise<LoanApplication> {
  const res = await apiClient.put(`/api/loan-applications/${id}`, payload)
  return res.data
}

export async function deleteLoanApplication(id: number): Promise<{ status: string }> {
  const res = await apiClient.delete(`/api/loan-applications/${id}`)
  return res.data
}

export async function submitFullLoanApplication(payload: FullLoanApplicationData) {
  const res = await apiClient.post('/api/loan-applications/apply', payload)
  return res.data
}

export async function addLoanApplication(payload: any) {
  const res = await apiClient.post('/api/auth/customer/add', payload)
  return res.data
}
