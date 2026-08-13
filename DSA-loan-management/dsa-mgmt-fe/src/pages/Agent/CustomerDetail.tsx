import React from 'react'
import { useParams } from 'react-router-dom'

export default function AgentCustomerDetail() {
  const { id } = useParams()
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">Agent — Customer Detail</h2>
      <p className="mt-2">Customer id: {id}</p>
    </div>
  )
}
