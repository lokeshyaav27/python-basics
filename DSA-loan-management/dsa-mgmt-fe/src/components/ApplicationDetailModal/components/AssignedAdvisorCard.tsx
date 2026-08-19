import React from 'react'
import { LoanApplication } from '../../../services/loanApplications'
import { API_BASE_URL } from '../../../constants'

interface AssignedAdvisorCardProps {
  application: LoanApplication
}

export const AssignedAdvisorCard: React.FC<AssignedAdvisorCardProps> = ({ application }) => {
  if (!application.agentName) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {application.agentPhoto ? (
          <img
            src={`${API_BASE_URL}/static/agent-photos/${application.agentPhoto}`}
            alt={application.agentName}
            className="h-10 w-10 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {application.agentName.charAt(0)}
          </div>
        )}
        <div>
          <span className="text-[11px] text-slate-400 block">Assigned DSA Loan Advisor</span>
          <span className="text-xs font-bold text-slate-800">{application.agentName}</span>
          <span className="text-[11px] text-slate-500 block">{application.agentEmail}</span>
        </div>
      </div>
      {application.agentMobile && (
        <a
          href={`tel:${application.agentMobile}`}
          className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-blue-600 border border-slate-200 hover:bg-blue-50 transition shadow-2xs"
        >
          📞 Call {application.agentMobile}
        </a>
      )}
    </div>
  )
}

export default AssignedAdvisorCard
