import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import {
  Home,
  AboutUs,
  WhyChooseUs,
  ContactUs,
  Faqs,
  PrivacyPolicy,
  TermsOfUse,
  Partners,
  ProductsCatalog,
  CustomerLogin,
  AgentLogin,
  AdminLogin,
  ApplyForLoan,
  AdminDashboard,
  AdminProducts,
  AdminBanks,
  AdminAgents,
  AdminLoanApplications,
  AdminContactEnquiries,
  AdminAIIssues,
  AgentLoanApplications,
  CustomerPortal,
  CustomerLoanList,
  CustomerLoanDetail,
  CheckEligibility,
  LoanComparison,
  ChatWithAI,
} from '../pages'
import { NotFound, Unauthorized, ProtectedRoute } from '../components'

const withRole = (role: 'admin' | 'agent' | 'customer', Component: React.ComponentType) => (
  <ProtectedRoute role={role}>
    <Component />
  </ProtectedRoute>
)

const withAnyRole = (roles: Array<'admin' | 'agent' | 'customer'>, Component: React.ComponentType) => (
  <ProtectedRoute role={roles}>
    <Component />
  </ProtectedRoute>
)

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.ABOUT_US} element={<AboutUs />} />
      <Route path={ROUTES.WHY_CHOOSE_US} element={<WhyChooseUs />} />
      <Route path={ROUTES.CONTACT_US} element={<ContactUs />} />
      <Route path={ROUTES.PRODUCTS} element={<ProductsCatalog />} />
      <Route path={ROUTES.PARTNERS} element={<Partners />} />
      <Route path={ROUTES.FAQS} element={<Faqs />} />
      <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
      <Route path={ROUTES.TERMS_OF_USE} element={<TermsOfUse />} />

      {/* Auth & Loan Application */}
      <Route path={ROUTES.CUSTOMER_LOGIN} element={<CustomerLogin />} />
      <Route path={ROUTES.AGENT_LOGIN} element={<AgentLogin />} />
      <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
      <Route path={ROUTES.APPLY_FOR_LOAN} element={<ApplyForLoan />} />

      {/* Admin Routes */}
      <Route path={ROUTES.ADMIN.DASHBOARD} element={withRole('admin', AdminDashboard)} />
      <Route path={ROUTES.ADMIN.PRODUCTS} element={withRole('admin', AdminProducts)} />
      <Route path={ROUTES.ADMIN.BANKS} element={withRole('admin', AdminBanks)} />
      <Route path={ROUTES.ADMIN.AGENTS} element={withRole('admin', AdminAgents)} />
      <Route path={ROUTES.ADMIN.LOAN_APPLICATIONS} element={withRole('admin', AdminLoanApplications)} />
      <Route path={ROUTES.ADMIN.CONTACT_ENQUIRIES} element={withRole('admin', AdminContactEnquiries)} />
      <Route path={ROUTES.ADMIN.CHAT_WITH_AI} element={withRole('admin', ChatWithAI)} />
      <Route path={ROUTES.ADMIN.AI_ISSUES} element={withRole('admin', AdminAIIssues)} />
      <Route path={ROUTES.ADMIN.CHECK_ELIGIBILITY} element={withRole('admin', CheckEligibility)} />
      <Route path={ROUTES.ADMIN.LOAN_COMPARISON} element={withRole('admin', LoanComparison)} />

      {/* Agent Routes */}
      <Route path={ROUTES.AGENT.LOAN_APPLICATIONS} element={withRole('agent', AgentLoanApplications)} />
      <Route path={ROUTES.AGENT.CHAT_WITH_AI} element={withRole('agent', ChatWithAI)} />
      <Route path={ROUTES.AGENT.CHECK_ELIGIBILITY} element={withRole('agent', CheckEligibility)} />
      <Route path={ROUTES.AGENT.LOAN_COMPARISON} element={withRole('agent', LoanComparison)} />

      {/* Customer Routes */}
      <Route path={ROUTES.CUSTOMER.PORTAL} element={withRole('customer', CustomerPortal)} />
      <Route path={ROUTES.CUSTOMER.LOANS} element={withRole('customer', CustomerLoanList)} />
      <Route path={ROUTES.CUSTOMER.LOAN_DETAIL} element={withRole('customer', CustomerLoanDetail)} />
      <Route path={ROUTES.CUSTOMER.CHAT_WITH_AI} element={withRole('customer', ChatWithAI)} />
      <Route path={ROUTES.CUSTOMER.CHECK_ELIGIBILITY} element={withRole('customer', CheckEligibility)} />
      <Route path={ROUTES.CUSTOMER.LOAN_COMPARISON} element={withRole('customer', LoanComparison)} />

      {/* Shared Authenticated Routes */}
      <Route path={ROUTES.SHARED.CHECK_ELIGIBILITY} element={withAnyRole(['admin', 'agent', 'customer'], CheckEligibility)} />
      <Route path={ROUTES.SHARED.LOAN_COMPARISON} element={withAnyRole(['admin', 'agent', 'customer'], LoanComparison)} />
      <Route path={ROUTES.SHARED.CHAT_WITH_AI} element={withAnyRole(['admin', 'agent', 'customer'], ChatWithAI)} />

      {/* Error & Fallback */}
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  )
}

export default AppRoutes
