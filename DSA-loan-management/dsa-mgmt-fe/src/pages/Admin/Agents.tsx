import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '../../services/agents'
import { message, Tooltip } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'

type Agent = {
  id: number
  name: string
  email: string
  mobile: string
  tempPassword?: string
  tempPasswordReset: boolean
  isAdmin: boolean
  photo?: string
}

const BLANK_FORM = { name: '', email: '', mobile: '', password: '', isAdmin: false, photo: '' }
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const Avatar: React.FC<{ photo?: string; name: string }> = ({ photo, name }) => {
  if (photo) {
    return (
      <img
        src={`${API_BASE_URL}/static/agent-photos/${photo}`}
        alt={name}
        className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-sm"
      />
    )
  }
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const AgentsPage: React.FC = () => {
  const qc = useQueryClient()
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['admin-agents'],
    queryFn: fetchAgents,
  })

  const createMut = useMutation({
    mutationFn: createAgent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-agents'] }); message.success('Agent created') },
    onError: (err: any) => { message.error(err?.response?.data?.detail || 'Failed to create agent') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateAgent(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-agents'] }); message.success('Agent updated') },
    onError: (err: any) => { message.error(err?.response?.data?.detail || 'Failed to update agent') },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAgent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-agents'] }); message.success('Agent deleted') },
    onError: (err: any) => { message.error(err?.response?.data?.detail || 'Failed to delete agent') },
  })

  const [showAdd, setShowAdd]           = useState(false)
  const [showEdit, setShowEdit]         = useState(false)
  const [showView, setShowView]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [active, setActive]             = useState<Agent | null>(null)
  const [form, setForm]                 = useState(BLANK_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto]   = useState(false)

  const openAdd = () => {
    setForm(BLANK_FORM)
    setSelectedFile(null)
    setRemovePhoto(false)
    setShowAdd(true)
  }

  const openEdit = (a: Agent) => {
    setActive(a)
    setForm({ name: a.name, email: a.email, mobile: a.mobile, password: '', isAdmin: a.isAdmin, photo: a.photo || '' })
    setSelectedFile(null)
    setRemovePhoto(false)
    setShowEdit(true)
  }

  const openView = (a: Agent) => {
    setActive(a)
    setShowView(true)
  }

  const validateFile = (file: File) => {
    if (file.size > 3 * 1024 * 1024) { message.error('Photo must be ≤ 3 MB'); return false }
    return true
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile && !validateFile(selectedFile)) return
    await createMut.mutateAsync({
      name: form.name, email: form.email, mobile: form.mobile,
      password: form.password, isAdmin: form.isAdmin,
      file: selectedFile,
    })
    setShowAdd(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!active) return
    if (selectedFile && !validateFile(selectedFile)) return
    await updateMut.mutateAsync({
      id: active.id,
      payload: {
        name: form.name, email: form.email, mobile: form.mobile,
        isAdmin: form.isAdmin, file: selectedFile, remove_photo: removePhoto,
      },
    })
    setShowEdit(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  const badgeClass = (on: boolean) =>
    on
      ? 'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700'
      : 'inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-500'

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agents</h2>
          <p className="text-sm text-slate-500">Manage DSA agents and their accounts</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <UserAddOutlined /> Add Agent
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Agent</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pwd Reset</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-400">No agents found.</td></tr>
            ) : (
              agents.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar photo={a.photo} name={a.name} />
                      <span className="text-sm font-medium text-slate-800">{a.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-600">{a.email}</td>
                  <td className="p-3 text-sm text-slate-600">{a.mobile}</td>
                  <td className="p-3">
                    <span className={badgeClass(a.isAdmin)}>{a.isAdmin ? 'Admin' : 'Agent'}</span>
                  </td>
                  <td className="p-3">
                    <span className={badgeClass(a.tempPasswordReset)}>{a.tempPasswordReset ? 'Done' : 'Pending'}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Tooltip title="View Agent Details">
                        <button
                          onClick={() => openView(a)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="View Details"
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Edit Agent">
                        <button
                          onClick={() => openEdit(a)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Edit Agent"
                        >
                          <EditOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Agent">
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: a.id })}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Delete Agent"
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

      {showAdd && (
        <Modal title="Add Agent" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Full Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe" className={inputCls} />
            </Field>
            <Field label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="agent@example.com" className={inputCls} />
            </Field>
            <Field label="Mobile">
              <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="9876543210" className={inputCls} />
            </Field>
            <Field label="Password">
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Set initial password" className={inputCls} />
            </Field>
            <Field label="Photo (optional)">
              <input type="file" accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="text-sm" />
              <p className="mt-1 text-xs text-slate-400">Max 3 MB. Any format.</p>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
              <span>This agent is an <strong>Admin</strong></span>
            </label>
            <ModalFooter onCancel={() => setShowAdd(false)} submitLabel="Create Agent" submitClass="bg-blue-600 hover:bg-blue-700 text-white" />
          </form>
        </Modal>
      )}

      {showEdit && active && (
        <Modal title="Edit Agent" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Full Name">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Mobile">
              <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Photo">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input type="file" accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="text-sm" />
                  <p className="mt-1 text-xs text-slate-400">Choose a file to replace the existing photo.</p>
                </div>
                <div className="flex-shrink-0">
                  {form.photo ? (
                    <div className="flex flex-col items-center gap-1">
                      <img src={`${API_BASE_URL}/static/agent-photos/${form.photo}`} alt="current"
                        className="h-16 w-16 rounded-full object-cover border" />
                      <button type="button"
                        onClick={() => { setRemovePhoto(true); setForm({ ...form, photo: '' }); setSelectedFile(null) }}
                        className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <Avatar photo={undefined} name={active.name} />
                  )}
                </div>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
              <span>This agent is an <strong>Admin</strong></span>
            </label>
            <ModalFooter onCancel={() => setShowEdit(false)} submitLabel="Save Changes" submitClass="bg-yellow-500 hover:bg-yellow-600 text-white" />
          </form>
        </Modal>
      )}

      {showView && active && (
        <Modal title="Agent Details" onClose={() => setShowView(false)}>
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100">
            <Avatar photo={active.photo} name={active.name} />
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-800">{active.name}</div>
              <span className={badgeClass(active.isAdmin)}>{active.isAdmin ? 'Admin' : 'Agent'}</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <ViewRow label="Email" value={active.email} />
            <ViewRow label="Mobile" value={active.mobile} />
            <ViewRow label="Password Reset" value={active.tempPasswordReset ? '✅ Done' : '⏳ Pending'} />
            {active.photo && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Photo</div>
                <img src={`${API_BASE_URL}/static/agent-photos/${active.photo}`} alt={active.name}
                  className="mt-1 h-32 w-32 rounded-xl object-cover border" />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setShowView(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition">Close</button>
          </div>
        </Modal>
      )}

      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">🗑️</span>
              <h3 className="text-lg font-semibold text-slate-800">Delete Agent</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">This will permanently delete the agent and their photo. This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete({ open: false })} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

const Modal: React.FC<{
  title: string
  children: React.ReactNode
  onClose: () => void
}> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

const ViewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div className="flex justify-between text-sm">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  )
}

const ModalFooter: React.FC<{
  onCancel: () => void
  submitLabel: string
  submitClass: string
}> = ({ onCancel, submitLabel, submitClass }) => {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
      <button type="submit" className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${submitClass}`}>{submitLabel}</button>
    </div>
  )
}

export default AgentsPage
