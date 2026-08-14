import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <div className="mt-4 space-y-2">
        <Link to="/admin/products" className="block text-blue-600">Manage Products</Link>
        <Link to="/admin/banks" className="block text-blue-600">Manage Banks</Link>
        <Link to="/admin/agents" className="block text-blue-600">Manage Agents</Link>
        <Link to="/admin/loan-applications" className="block text-blue-600">Manage Loan Applications</Link>
      </div>
    </div>
  )
}
