import React from 'react'
import { LoanApplication } from '../../../services/loanApplications'
import { ApplicationTableRow } from './ApplicationTableRow'

interface ApplicationsTableProps {
  applications: LoanApplication[]
  isLoading: boolean
  onViewDetails: (app: LoanApplication) => void
  onAssignAgent: (app: LoanApplication) => void
  onEdit: (app: LoanApplication) => void
  onDelete: (id: number) => void
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  isLoading,
  onViewDetails,
  onAssignAgent,
  onEdit,
  onDelete,
}) => {
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
              Status
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assigned Agent
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Commission Received
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-slate-400">
                Loading loan applications…
              </td>
            </tr>
          ) : applications.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-slate-400">
                No applications found.
              </td>
            </tr>
          ) : (

            applications.map((app) => (
              <ApplicationTableRow
                key={app.id}
                app={app}
                onViewDetails={onViewDetails}
                onAssignAgent={onAssignAgent}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ApplicationsTable
