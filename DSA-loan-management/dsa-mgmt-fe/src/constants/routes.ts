/**
 * Centralized Route Constants for the DSA Loan Management Platform
 */

export const ROUTES = {
  // Public Pages
  HOME: '/',
  ABOUT_US: '/about-us',
  WHY_CHOOSE_US: '/why-choose-us',
  CONTACT_US: '/contact-us',
  PRODUCTS: '/products',
  PARTNERS: '/partners',
  FAQS: '/faqs',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_USE: '/terms-of-use',
  APPLY_FOR_LOAN: '/apply-for-loan',

  // Authentication Pages
  CUSTOMER_LOGIN: '/customer-login',
  AGENT_LOGIN: '/agent-login',
  ADMIN_LOGIN: '/admin-login',

  // Admin Portal Routes
  ADMIN: {
    DASHBOARD: '/admin',
    PRODUCTS: '/admin/products',
    BANKS: '/admin/banks',
    AGENTS: '/admin/agents',
    LOAN_APPLICATIONS: '/admin/loan-applications',
    CONTACT_ENQUIRIES: '/admin/contact-enquiries',
  },

  // Agent Portal Routes
  AGENT: {
    LOAN_APPLICATIONS: '/agent/loan-applications',
    CHECK_ELIGIBILITY: '/agent/check-eligibility',
    LOAN_COMPARISON: '/agent/loan-comparison',
    CHAT_WITH_AI: '/agent/chat-with-ai',
  },

  // Customer Portal Routes
  CUSTOMER: {
    PORTAL: '/customer',
    LOANS: '/customer/loans',
    LOAN_DETAIL: '/customer/loans/:id',
    CHECK_ELIGIBILITY: '/customer/check-eligibility',
    LOAN_COMPARISON: '/customer/loan-comparison',
    CHAT_WITH_AI: '/customer/chat-with-ai',
  },

  // Shared & Fallback Utilities
  SHARED: {
    CHECK_ELIGIBILITY: '/check-eligibility',
    LOAN_COMPARISON: '/loan-comparison',
    CHAT_WITH_AI: '/chat-with-ai',
  },

  // System & Status Routes
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
} as const

/**
 * Dynamic route path builders
 */
export const buildRoute = {
  customerLoanDetail: (id: string | number) => `/customer/loans/${id}`,
} as const

export type AppRoute = typeof ROUTES
