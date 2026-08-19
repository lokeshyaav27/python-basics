import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

// Pages
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
  AgentLoanApplications,
  CustomerPortal,
  CustomerLoanList,
  CustomerLoanDetail,
  CheckEligibility,
  LoanComparison,
  ChatWithAI,
} from '../pages'

// Components
import { NotFound, Unauthorized, ProtectedRoute } from '../components'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ── Public Pages ────────────────────────────────────────────────── */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.ABOUT_US} element={<AboutUs />} />
      <Route path={ROUTES.WHY_CHOOSE_US} element={<WhyChooseUs />} />
      <Route path={ROUTES.CONTACT_US} element={<ContactUs />} />
      <Route path={ROUTES.PRODUCTS} element={<ProductsCatalog />} />
      <Route path={ROUTES.PARTNERS} element={<Partners />} />
      <Route path={ROUTES.FAQS} element={<Faqs />} />
      <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
      <Route path={ROUTES.TERMS_OF_USE} element={<TermsOfUse />} />

      {/* ── Authentication & Loan Application ───────────────────────────── */}
      <Route path={ROUTES.CUSTOMER_LOGIN} element={<CustomerLogin />} />
      <Route path={ROUTES.AGENT_LOGIN} element={<AgentLogin />} />
      <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
      <Route path={ROUTES.APPLY_FOR_LOAN} element={<ApplyForLoan />} />

      {/* ── Admin Routes ────────────────────────────────────────────────── */}
      <Route
        path={ROUTES.ADMIN.DASHBOARD}
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.PRODUCTS}
        element={
          <ProtectedRoute role="admin">
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.BANKS}
        element={
          <ProtectedRoute role="admin">
            <AdminBanks />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.AGENTS}
        element={
          <ProtectedRoute role="admin">
            <AdminAgents />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.LOAN_APPLICATIONS}
        element={
          <ProtectedRoute role="admin">
            <AdminLoanApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.CONTACT_ENQUIRIES}
        element={
          <ProtectedRoute role="admin">
            <AdminContactEnquiries />
          </ProtectedRoute>
        }
      />

      {/* ── Agent Routes ────────────────────────────────────────────────── */}
      <Route
        path={ROUTES.AGENT.LOAN_APPLICATIONS}
        element={
          <ProtectedRoute role="agent">
            <AgentLoanApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AGENT.CHECK_ELIGIBILITY}
        element={
          <ProtectedRoute role="agent">
            <CheckEligibility />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AGENT.LOAN_COMPARISON}
        element={
          <ProtectedRoute role="agent">
            <LoanComparison />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AGENT.CHAT_WITH_AI}
        element={
          <ProtectedRoute role="agent">
            <ChatWithAI />
          </ProtectedRoute>
        }
      />

      {/* ── Customer Routes ─────────────────────────────────────────────── */}
      <Route
        path={ROUTES.CUSTOMER.PORTAL}
        element={
          <ProtectedRoute role="customer">
            <CustomerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER.LOANS}
        element={
          <ProtectedRoute role="customer">
            <CustomerLoanList />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER.LOAN_DETAIL}
        element={
          <ProtectedRoute role="customer">
            <CustomerLoanDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER.CHECK_ELIGIBILITY}
        element={
          <ProtectedRoute role="customer">
            <CheckEligibility />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER.LOAN_COMPARISON}
        element={
          <ProtectedRoute role="customer">
            <LoanComparison />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CUSTOMER.CHAT_WITH_AI}
        element={
          <ProtectedRoute role="customer">
            <ChatWithAI />
          </ProtectedRoute>
        }
      />

      {/* ── Direct Fallback / Shared Utilities ──────────────────────────── */}
      <Route path={ROUTES.SHARED.CHECK_ELIGIBILITY} element={<CheckEligibility />} />
      <Route path={ROUTES.SHARED.LOAN_COMPARISON} element={<LoanComparison />} />
      <Route path={ROUTES.SHARED.CHAT_WITH_AI} element={<ChatWithAI />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

      {/* ── Error / Not Found Fallbacks ─────────────────────────────────── */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  )
}

export default AppRoutes
