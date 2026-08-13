import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Public/Home'
import AboutUs from './pages/Public/AboutUs'
import ContactUs from './pages/Public/ContactUs'
import Login from './pages/Public/Login'
import CustomerLogin from './pages/Public/CustomerLogin'
import AgentLogin from './pages/Public/AgentLogin'
import AdminLogin from './pages/Public/AdminLogin'
import ApplyLoanPublic from './pages/Public/ApplyLoan'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ProductsPage from './pages/Admin/Products'
import BanksPage from './pages/Admin/Banks'
import AgentsPage from './pages/Admin/Agents'
import CustomersPage from './pages/Admin/Customers'
import AgentCustomerList from './pages/Agent/CustomerList'
import AgentCustomerDetail from './pages/Agent/CustomerDetail'
import CustomerPortal from './pages/Customer/Portal'
import CustomerLoanList from './pages/Customer/LoanList'
import LoanDetail from './pages/Customer/LoanDetail'
import NotFound from './pages/NotFound'
import { ProtectedRoute } from './auth/AuthProvider'
import { Link } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-xl font-bold">DSA Finance</div>
          <nav className="space-x-4">
            <Link to="/" className="text-slate-700">Home</Link>
            <Link to="/apply" className="text-slate-700">Apply</Link>
            <Link to="/about-us" className="text-slate-700">About Us</Link>
            <Link to="/contact-us" className="text-slate-700">Contact</Link>
            <Link to="/customer-login" className="text-slate-700">Customer Login</Link>
            <Link to="/agent-login" className="text-slate-700">Agent Login</Link>
            <Link to="/admin-login" className="text-slate-700">Admin Login</Link>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        {/* legacy single login removed; new dedicated login pages */}
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/agent-login" element={<AgentLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/apply" element={<ApplyLoanPublic />} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role={'admin'}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute role={'admin'}><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin/banks" element={<ProtectedRoute role={'admin'}><BanksPage /></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute role={'admin'}><AgentsPage /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute role={'admin'}><CustomersPage /></ProtectedRoute>} />

        {/* Agent routes */}
        <Route path="/agent/customers" element={<ProtectedRoute role={'agent'}><AgentCustomerList /></ProtectedRoute>} />
        <Route path="/agent/customers/:id" element={<ProtectedRoute role={'agent'}><AgentCustomerDetail /></ProtectedRoute>} />

        {/* Customer routes */}
        <Route path="/customer" element={<ProtectedRoute role={'customer'}><CustomerPortal /></ProtectedRoute>} />
        <Route path="/customer/loans" element={<ProtectedRoute role={'customer'}><CustomerLoanList /></ProtectedRoute>} />
        <Route path="/customer/loans/:id" element={<ProtectedRoute role={'customer'}><LoanDetail /></ProtectedRoute>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
