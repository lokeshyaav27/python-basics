import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Public/Home'
import AboutUs from './pages/Public/AboutUs'
import WhyChooseUs from './pages/Public/WhyChooseUs'
import ContactUs from './pages/Public/ContactUs'
import Faqs from './pages/Public/Faqs'
import PrivacyPolicy from './pages/Public/PrivacyPolicy'
import TermsOfUse from './pages/Public/TermsOfUse'
import Partners from './pages/Public/Partners'
import ProductsCatalog from './pages/Public/ProductsCatalog'
import CustomerLogin from './pages/Public/CustomerLogin'
import AgentLogin from './pages/Public/AgentLogin'
import AdminLogin from './pages/Public/AdminLogin'
import ApplyForLoan from './pages/Public/ApplyForLoan'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ProductsPage from './pages/Admin/Products'
import BanksPage from './pages/Admin/Banks'
import AgentsPage from './pages/Admin/Agents'
import AdminLoanApplicationsPage from './pages/Admin/LoanApplications'
import ContactEnquiriesPage from './pages/Admin/ContactEnquiries'
import AgentLoanApplicationsPage from './pages/Agent/LoanApplications'
import CustomerPortal from './pages/Customer/Portal'
import CustomerLoanList from './pages/Customer/LoanList'
import LoanDetail from './pages/Customer/LoanDetail'
import CheckEligibility from './pages/Shared/CheckEligibility'
import LoanComparison from './pages/Shared/LoanComparison'
import ChatWithAI from './pages/Shared/ChatWithAI'
import NotFound from './pages/NotFound'
import { ProtectedRoute, useAuth } from './auth/AuthProvider'
import ProtectedLayout from './components/ProtectedLayout'
import Footer from './components/Footer'
import { Link } from 'react-router-dom'

export default function App() {
  let authUser: any = null
  try {
    const auth = useAuth()
    authUser = auth?.user ?? null
  } catch (e) {
    authUser = null
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        {(() => {
          if (authUser) return null

          return (
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
                <Link to="/" className="flex items-center gap-3 min-w-0">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white shadow-sm">D</span>
                  <span className="leading-tight">
                    <span className="block text-lg font-bold text-slate-900">DSA Finance</span>
                    <span className="block text-[10px] text-slate-500">Your Trusted Loan Partner</span>
                  </span>
                </Link>

                <nav className="hidden items-center gap-8 lg:flex">
                  <Link to="/" className="relative text-sm font-semibold text-blue-700 after:absolute after:-bottom-5 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-blue-600">Home</Link>
                  <Link to="/products" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">Loan Products</Link>
                  <Link to="/why-choose-us" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">Why Choose Us</Link>
                  <Link to="/about-us" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">About Us</Link>
                  <Link to="/contact-us" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">Contact Us</Link>
                  <Link to="/customer-login" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">Customer Login</Link>
                </nav>

                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-2 text-blue-600 md:flex">
                    <span className="text-lg">☎</span>
                    <span className="leading-tight">
                      <span className="block text-[11px] font-bold text-slate-900">1800-123-4567</span>
                      <span className="block text-[9px] text-slate-500">Mon - Sat 9:00 AM - 7:00 PM</span>
                    </span>
                  </div>

                  <Link to="/apply-for-loan" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                    Apply for Loan
                  </Link>
                </div>
              </div>
            </header>
          )
        })()}

        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/why-choose-us" element={<WhyChooseUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/products" element={<ProductsCatalog />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            
            {/* Dedicated Login Pages */}
            <Route path="/customer-login" element={<CustomerLogin />} />
            <Route path="/agent-login" element={<AgentLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Multi-step Loan Application (Public & Customer) */}
            <Route path="/apply-for-loan" element={<ApplyForLoan />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role={'admin'}>
                  <ProtectedLayout role={'admin'}>
                    <AdminDashboard />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute role={'admin'}>
                  <ProtectedLayout role={'admin'}>
                    <ProductsPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banks"
              element={
                <ProtectedRoute role={'admin'}>
                  <ProtectedLayout role={'admin'}>
                    <BanksPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agents"
              element={
                <ProtectedRoute role={'admin'}>
                  <ProtectedLayout role={'admin'}>
                    <AgentsPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/loan-applications"
              element={
                <ProtectedRoute role={'admin'}>
                  <ProtectedLayout role={'admin'}>
                    <AdminLoanApplicationsPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contact-enquiries"
              element={
                <ProtectedRoute role={'admin'}>
                  <ProtectedLayout role={'admin'}>
                    <ContactEnquiriesPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Agent routes */}
            <Route
              path="/agent/loan-applications"
              element={
                <ProtectedRoute role={'agent'}>
                  <ProtectedLayout role={'agent'}>
                    <AgentLoanApplicationsPage />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/check-eligibility"
              element={
                <ProtectedRoute role={'agent'}>
                  <ProtectedLayout role={'agent'}>
                    <CheckEligibility />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/loan-comparison"
              element={
                <ProtectedRoute role={'agent'}>
                  <ProtectedLayout role={'agent'}>
                    <LoanComparison />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/chat-with-ai"
              element={
                <ProtectedRoute role={'agent'}>
                  <ProtectedLayout role={'agent'}>
                    <ChatWithAI />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Customer routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute role={'customer'}>
                  <ProtectedLayout role={'customer'}>
                    <CustomerPortal />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/loans"
              element={
                <ProtectedRoute role={'customer'}>
                  <ProtectedLayout role={'customer'}>
                    <CustomerLoanList />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/loans/:id"
              element={
                <ProtectedRoute role={'customer'}>
                  <ProtectedLayout role={'customer'}>
                    <LoanDetail />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/check-eligibility"
              element={
                <ProtectedRoute role={'customer'}>
                  <ProtectedLayout role={'customer'}>
                    <CheckEligibility />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/loan-comparison"
              element={
                <ProtectedRoute role={'customer'}>
                  <ProtectedLayout role={'customer'}>
                    <LoanComparison />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/chat-with-ai"
              element={
                <ProtectedRoute role={'customer'}>
                  <ProtectedLayout role={'customer'}>
                    <ChatWithAI />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Direct fallback routes */}
            <Route path="/check-eligibility" element={<CheckEligibility />} />
            <Route path="/loan-comparison" element={<LoanComparison />} />
            <Route path="/chat-with-ai" element={<ChatWithAI />} />


            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>

        {!authUser && <Footer />}
      </div>
    </BrowserRouter>
  )
}
