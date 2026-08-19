import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

// Public Pages
import Home from '../pages/Public/Home'
import AboutUs from '../pages/Public/AboutUs'
import WhyChooseUs from '../pages/Public/WhyChooseUs'
import ContactUs from '../pages/Public/ContactUs'
import Faqs from '../pages/Public/Faqs'
import PrivacyPolicy from '../pages/Public/PrivacyPolicy'
import TermsOfUse from '../pages/Public/TermsOfUse'
import Partners from '../pages/Public/Partners'
import ProductsCatalog from '../pages/Public/ProductsCatalog'
import CustomerLogin from '../pages/Public/CustomerLogin'
import AgentLogin from '../pages/Public/AgentLogin'
import AdminLogin from '../pages/Public/AdminLogin'
import ApplyForLoan from '../pages/Public/ApplyForLoan'

// Admin Pages
import AdminDashboard from '../pages/Admin/AdminDashboard'
import ProductsPage from '../pages/Admin/Products'
import BanksPage from '../pages/Admin/Banks'
import AgentsPage from '../pages/Admin/Agents'
import AdminLoanApplicationsPage from '../pages/Admin/LoanApplications'
import ContactEnquiriesPage from '../pages/Admin/ContactEnquiries'

// Agent Pages
import AgentLoanApplicationsPage from '../pages/Agent/LoanApplications'

// Customer Pages
import CustomerPortal from '../pages/Customer/Portal'
import CustomerLoanList from '../pages/Customer/LoanList'
import LoanDetail from '../pages/Customer/LoanDetail'

// Shared & System Pages
import CheckEligibility from '../pages/Shared/CheckEligibility'
import LoanComparison from '../pages/Shared/LoanComparison'
import ChatWithAI from '../pages/Shared/ChatWithAI'
import NotFound from '../pages/NotFound'
import Unauthorized from '../pages/Unauthorized'

// Route Protection
import ProtectedRoute from '../components/ProtectedRoute'

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
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.BANKS}
        element={
          <ProtectedRoute role="admin">
            <BanksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.AGENTS}
        element={
          <ProtectedRoute role="admin">
            <AgentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.LOAN_APPLICATIONS}
        element={
          <ProtectedRoute role="admin">
            <AdminLoanApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.CONTACT_ENQUIRIES}
        element={
          <ProtectedRoute role="admin">
            <ContactEnquiriesPage />
          </ProtectedRoute>
        }
      />

      {/* ── Agent Routes ────────────────────────────────────────────────── */}
      <Route
        path={ROUTES.AGENT.LOAN_APPLICATIONS}
        element={
          <ProtectedRoute role="agent">
            <AgentLoanApplicationsPage />
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
            <LoanDetail />
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
