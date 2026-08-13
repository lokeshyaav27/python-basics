import React from 'react'
import { useParams } from 'react-router-dom'

export default function LoanDetail() {
  const { id } = useParams()
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">Customer — Loan Detail</h2>
      <p className="mt-2">Loan id: {id}</p>
    </div>
  )
}
