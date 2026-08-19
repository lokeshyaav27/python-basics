import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '../../services/agents'
import { message } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import {
  Agent,
  AgentFormModal,
  AgentViewModal,
  DeleteAgentModal,
  AgentsTable,
} from './components'

const AdminAgents: React.FC = () => {
  const qc = useQueryClient()
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['admin-agents'],
    queryFn: fetchAgents,
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({
    open: false,
  })
  const [active, setActive] = useState<Agent | null>(null)

  const createMut = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-agents'] })
      message.success('Agent created successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to create agent'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateAgent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-agents'] })
      message.success('Agent updated successfully')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to update agent'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAgent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-agents'] })
      message.success('Agent deleted')
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Failed to delete agent'),
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">DSA Agents & Officers</h2>
          <p className="text-sm text-slate-500">
            Manage agents, advisors, login credentials, and administrator roles
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <UserAddOutlined /> Add Agent
        </button>
      </div>

      {/* Table */}
      <AgentsTable
        agents={agents}
        isLoading={isLoading}
        onView={(a) => {
          setActive(a)
          setShowView(true)
        }}
        onEdit={(a) => {
          setActive(a)
          setShowEdit(true)
        }}
        onDelete={(id) => setConfirmDelete({ open: true, id })}
      />

      {/* Add Modal */}
      {showAdd && (
        <AgentFormModal
          title="Add New DSA Agent"
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            await createMut.mutateAsync(data)
          }}
        />
      )}

      {/* Edit Modal */}
      {showEdit && active && (
        <AgentFormModal
          title="Edit DSA Agent"
          initialData={active}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => {
            await updateMut.mutateAsync({ id: active.id, payload: data })
          }}
        />
      )}

      {/* View Modal */}
      {showView && active && (
        <AgentViewModal agent={active} onClose={() => setShowView(false)} />
      )}

      {/* Delete Confirmation */}
      <DeleteAgentModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={async () => {
          if (confirmDelete.id) {
            await deleteMut.mutateAsync(confirmDelete.id)
            setConfirmDelete({ open: false })
          }
        }}
      />
    </div>
  )
}

export default AdminAgents
