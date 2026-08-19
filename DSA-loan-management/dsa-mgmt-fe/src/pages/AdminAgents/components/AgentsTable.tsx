import React from 'react'
import { Tooltip } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Agent } from './AgentFormModal'
import { API_BASE_URL } from '../../../constants'

const Avatar: React.FC<{ photo?: string; name: string }> = ({ photo, name }) => {
  if (photo) {
    return (
      <img
        src={`${API_BASE_URL}/static/agent-photos/${photo}`}
        alt={name}
        className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-xs"
      />
    )
  }
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-xs">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

interface AgentsTableProps {
  agents: Agent[]
  isLoading: boolean
  onView: (agent: Agent) => void
  onEdit: (agent: Agent) => void
  onDelete: (id: number) => void
}

export const AgentsTable: React.FC<AgentsTableProps> = ({
  agents,
  isLoading,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full table-auto text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
          <tr>
            <th className="p-3">Agent</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Role</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {isLoading ? (
            <tr>
              <td colSpan={4} className="p-6 text-center text-slate-400">
                Loading agents…
              </td>
            </tr>
          ) : agents.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-6 text-center text-slate-400">
                No agents found.
              </td>
            </tr>
          ) : (
            agents.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 transition">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar photo={a.photo} name={a.name} />
                    <div>
                      <span className="block font-bold text-slate-800">{a.name}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">ID: #{a.id}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-slate-600">{a.email}</div>
                  <div className="text-slate-500 font-mono mt-0.5">{a.mobile}</div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.isAdmin
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {a.isAdmin ? 'Admin' : 'Agent'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <Tooltip title="View Agent Profile">
                      <button
                        onClick={() => onView(a)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                      >
                        <EyeOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title="Edit Agent">
                      <button
                        onClick={() => onEdit(a)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-amber-200/70"
                      >
                        <EditOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title="Delete Agent">
                      <button
                        onClick={() => onDelete(a.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition border border-rose-200/70"
                      >
                        <DeleteOutlined />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default AgentsTable
