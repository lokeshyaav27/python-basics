import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Public/Home'
import Login from './pages/Public/Login'
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
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
