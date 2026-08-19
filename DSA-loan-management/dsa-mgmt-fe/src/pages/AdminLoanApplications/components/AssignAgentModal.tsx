import React, { useState } from 'react'
import { LoanApplication } from '../../../services/loanApplications'
import { API_BASE_URL } from '../../../constants'

interface AssignAgentModalProps {
  application: LoanApplication | null
  agents: any[]
  onClose: () => void
  onAssign: (agentId: number | null) => Promise<void>
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({
  application,
  agents,
  onClose,
  onAssign,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(
    application?.agentId ?? null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!application) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onAssign(selectedAgentId)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Assign DSA Loan Advisor</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Assign an agent to manage Application #{application.id} for{' '}
          <strong>{application.name || 'Customer'}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Select Agent
            </label>
            <select
              value={selectedAgentId ?? ''}
              onChange={(e) =>
                setSelectedAgentId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white outline-none focus:border-blue-500"
            >
              <option value="">-- Unassigned (No Agent) --</option>
              {agents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email} • {agent.mobile})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning…' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignAgentModal
