import React from 'react'
import { API_BASE_URL } from '../../../constants'
import { Agent } from './AgentFormModal'

interface AgentViewModalProps {
  agent: Agent | null
  onClose: () => void
}

export const AgentViewModal: React.FC<AgentViewModalProps> = ({ agent, onClose }) => {
  if (!agent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
        {agent.photo ? (
          <img
            src={`${API_BASE_URL}/static/agent-photos/${agent.photo}`}
            alt={agent.name}
            className="h-20 w-20 rounded-full object-cover mx-auto border-2 border-blue-600 shadow-md"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            {agent.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-slate-800">{agent.name}</h3>
          <span className="text-xs font-semibold text-slate-400 font-mono">Agent ID: #{agent.id}</span>
          <div className="mt-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                agent.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {agent.isAdmin ? 'Administrator' : 'DSA Loan Advisor'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs text-left space-y-2">
          <div>
            <span className="text-slate-400 block">Email Address</span>
            <span className="font-semibold text-slate-700">{agent.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Mobile Number</span>
            <span className="font-semibold text-slate-700 font-mono">{agent.mobile}</span>
          </div>
          {agent.tempPassword && (
            <div>
              <span className="text-slate-400 block">Temporary Password</span>
              <span className="font-bold text-amber-600 font-mono">{agent.tempPassword}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentViewModal
