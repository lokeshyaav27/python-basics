/**
 * API Endpoint Name Constants and Base URL for DSA Loan Management System
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const API_ENDPOINT_NAMES = {
  // Authentication Endpoints
  AUTH: {
    CUSTOMER_REQUEST_OTP: '/api/auth/customer/request-otp',
    CUSTOMER_VERIFY_OTP: '/api/auth/customer/verify-otp',
    AGENT_LOGIN: '/api/auth/agent-login',
    ADMIN_LOGIN: '/api/auth/admin-login',
    AGENT_RESET_PASSWORD: '/api/auth/agent/reset-password',
    ME: '/api/auth/me',
  },

  // Agents Endpoints
  AGENTS: {
    BASE: '/api/agents',
    BY_ID: (id: number | string) => `/api/agents/${id}`,
  },

  // Banks & Bank Products Endpoints
  BANKS: {
    BASE: '/api/banks',
    BY_ID: (id: number | string) => `/api/banks/${id}`,
    PRODUCTS: (bankId: number | string) => `/api/banks/${bankId}/products`,
    PRODUCT_LINK: (bankId: number | string, productId: number | string) =>
      `/api/banks/${bankId}/products/${productId}/link`,
    PRODUCT_DOCUMENTS: (bankId: number | string, productId: number | string) =>
      `/api/banks/${bankId}/products/${productId}/documents`,
    PRODUCT_DOCUMENT_BY_ID: (
      bankId: number | string,
      productId: number | string,
      docId: number | string
    ) => `/api/banks/${bankId}/products/${productId}/documents/${docId}`,
    POLICY_PARAMETERS: (bankId: number | string, productId: number | string) =>
      `/api/banks/${bankId}/products/${productId}/policy-parameters`,
  },

  // Products Endpoints
  PRODUCTS: {
    BASE: '/api/products',
    BY_ID: (id: number | string) => `/api/products/${id}`,
  },

  // Loan Applications Endpoints
  LOAN_APPLICATIONS: {
    BASE: '/api/loan-applications',
    BY_ID: (id: number | string) => `/api/loan-applications/${id}`,
    APPLY: '/api/loan-applications/apply',
    ASSIGN_AGENT: (id: number | string) => `/api/loan-applications/${id}/assign-agent`,
    STATUS: (id: number | string) => `/api/loan-applications/${id}/status`,
  },

  // Contact / Lead Enquiries Endpoints
  CONTACT: {
    BASE: '/api/contact',
    STATUS: (id: number | string) => `/api/contact/${id}/status`,
  },

  // Comparison Matrix Endpoints
  COMPARISON: {
    BANKS: '/api/comparison/banks',
  },

  // Loan Eligibility Evaluation Endpoints
  ELIGIBILITY: {
    EVALUATE: '/api/eligibility/evaluate',
  },

  // AI Underwriting Assistant Chat Endpoints
  CHAT: {
    ASSISTANT: '/api/chat/assistant',
  },

  // AI Chat Issue Reporting & Quality Audit Endpoints
  AI_ISSUES: {
    BASE: '/api/ai-issues',
    REPORT: '/api/ai-issues/report',
    BY_ID: (id: number | string) => `/api/ai-issues/${id}`,
    STATUS: (id: number | string) => `/api/ai-issues/${id}/status`,
  },
} as const

export const API_ENDPOINTS = API_ENDPOINT_NAMES

export default API_ENDPOINT_NAMES
