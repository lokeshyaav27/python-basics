import React from 'react'
import { Tooltip, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  AuditOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { LoanApplication } from '../../../services/loanApplications'
import { ROUTES } from '../../../constants'
import { StatusBadge, checkApplicationCompleteness } from './CompletenessBadge'

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }
  const initial = name ? name.charAt(0).toUpperCase() : 'L'
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-xs shrink-0`}
    >
      {initial}
    </div>
  )
}

interface AgentApplicationsTableProps {
  applications: LoanApplication[]
  isLoading: boolean
  onViewDetails: (app: LoanApplication) => void
  onApprove: (app: LoanApplication) => void
  onReject: (app: LoanApplication) => void
}

export const AgentApplicationsTable: React.FC<AgentApplicationsTableProps> = ({
  applications,
  isLoading,
  onViewDetails,
  onApprove,
  onReject,
}) => {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full table-auto">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Applicant & ID
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completeness
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-sm text-slate-400">
                Loading your assigned applications…
              </td>
            </tr>
          ) : applications.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-sm text-slate-400">
                No assigned loan applications found.
              </td>
            </tr>
          ) : (
            applications.map((app) => {
              const { isComplete, message: completenessMsg } = checkApplicationCompleteness(app)
              const isFinalized = app.status === 'approved' || app.status === 'rejected'

              return (
                <tr key={app.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={app.name || 'User'} size="sm" />
                      <div>
                        <span className="block text-sm font-semibold text-slate-800">
                          {app.name || 'Anonymous User'}
                        </span>
                        <span className="block text-xs text-slate-400 font-mono">
                          #{app.id} • {app.mobile || app.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                      {app.productName || 'Loan'}
                    </span>
                  </td>
                  <td className="p-3">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <span>✓</span> 11 Params Complete
                      </span>
                    ) : (
                      <Tooltip title={completenessMsg}>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 cursor-help">
                          <ExclamationCircleOutlined /> Incomplete Data
                        </span>
                      </Tooltip>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={app.status} bankName={app.bankName} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Tooltip title="View & Edit Application Dossier">
                        <button
                          onClick={() => onViewDetails(app)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      {!isFinalized && (
                        <>
                          <Tooltip title="Evaluate Policy Eligibility">
                            <button
                              onClick={() =>
                                navigate(`${ROUTES.AGENT.CHECK_ELIGIBILITY}?applicationId=${app.id}`)
                              }
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-blue-200"
                            >
                              <AuditOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title="Compare Bank Rates Matrix">
                            <button
                              onClick={() =>
                                navigate(`${ROUTES.AGENT.LOAN_COMPARISON}?applicationId=${app.id}`)
                              }
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-indigo-200"
                            >
                              <BarChartOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title={isComplete ? 'Forward to Bank' : 'Complete missing fields first'}>
                            <button
                              onClick={() => {
                                if (!isComplete) {
                                  message.warning(completenessMsg)
                                  onViewDetails(app)
                                  return
                                }
                                onApprove(app)
                              }}
                              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-sm shadow-2xs hover:scale-105 active:scale-95 transition border ${
                                isComplete
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircleOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title="Reject Application">
                            <button
                              onClick={() => onReject(app)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-rose-200"
                            >
                              <CloseCircleOutlined />
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default AgentApplicationsTable
