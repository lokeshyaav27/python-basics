import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">DSA Frontend — Home</h1>
      <p className="mt-4">Welcome to the DSA Management frontend.</p>
      <div className="mt-4 space-x-2">
        <Link to="/apply" className="px-4 py-2 bg-blue-600 text-white rounded">Apply for Loan</Link>
        <Link to="/login" className="px-4 py-2 border rounded">Login</Link>
      </div>
    </div>
  )
}
