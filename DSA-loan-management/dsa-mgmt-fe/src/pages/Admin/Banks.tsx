import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBanks, createBank, updateBank, deleteBank } from '../../services/banks'
import { message } from 'antd'

type Bank = {
  id: number
  name: string
  isNationalize: boolean
  isPrivate: boolean
  isnbfc: boolean
  logo?: string
}

const BLANK_FORM = { name: '', isNationalize: false, isPrivate: false, isnbfc: false, logo: '' }
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function BankLogo({ logo, name, size = 'md' }: { logo?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }

  if (logo) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl border border-slate-200 bg-white p-1 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src={`${API_BASE_URL}/static/bank-logo-images/${logo}`}
          alt={name}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'B'
  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
    >
      {initial}
    </div>
  )
}

function BoolBadge({ value, activeLabel, activeColor = 'blue' }: { value: boolean; activeLabel: string; activeColor?: 'emerald' | 'blue' | 'purple' }) {
  if (!value) {
    return (
      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
        No
      </span>
    )
  }

  const colorStyles = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border ${colorStyles[activeColor]}`}>
      {activeLabel}
    </span>
  )
}

export default function BanksPage() {
  const qc = useQueryClient()
  const { data: banks = [], isLoading } = useQuery<Bank[]>({ queryKey: ['admin-banks'], queryFn: fetchBanks })

  const createMut = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      message.success('Bank created successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to create bank')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateBank(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      message.success('Bank updated successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update bank')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBank(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      message.success('Bank deleted successfully')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to delete bank')
    },
  })

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false })
  const [active, setActive] = useState<Bank | null>(null)

  const [form, setForm] = useState(BLANK_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  function validateFileSize(file: File) {
    const max = 3 * 1024 * 1024
    return file.size <= max
  }

  function openAdd() {
    setForm(BLANK_FORM)
    setSelectedFile(null)
    setRemoveLogo(false)
    setShowAdd(true)
  }

  function openEdit(b: Bank) {
    setActive(b)
    setForm({ name: b.name, isNationalize: b.isNationalize, isPrivate: b.isPrivate, isnbfc: b.isnbfc, logo: b.logo || '' })
    setSelectedFile(null)
    setRemoveLogo(false)
    setShowEdit(true)
  }

  function openView(b: Bank) {
    setActive(b)
    setShowView(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (selectedFile && !validateFileSize(selectedFile)) {
      message.error('Logo file must be ≤ 3 MB')
      return
    }

    await createMut.mutateAsync({
      name: form.name,
      isNationalize: form.isNationalize,
      isPrivate: form.isPrivate,
      isnbfc: form.isnbfc,
      file: selectedFile || undefined,
    })
    setShowAdd(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    if (selectedFile && !validateFileSize(selectedFile)) {
      message.error('Logo file must be ≤ 3 MB')
      return
    }

    await updateMut.mutateAsync({
      id: active.id,
      payload: {
        name: form.name,
        isNationalize: form.isNationalize,
        isPrivate: form.isPrivate,
        isnbfc: form.isnbfc,
        file: selectedFile,
        remove_logo: removeLogo,
      },
    })
    setShowEdit(false)
  }

  async function handleDelete() {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Banks & Lending Partners</h2>
          <p className="text-sm text-slate-500">Manage partner banks, financial institutions, and NBFCs</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          + Add Bank
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Bank / Institution</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nationalized</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Private</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">NBFC</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-slate-400">Loading banks…</td>
              </tr>
            ) : banks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-slate-400">No banks found.</td>
              </tr>
            ) : (
              banks.map((b) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  {/* Bank Name & Logo */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <BankLogo logo={b.logo} name={b.name} size="md" />
                      <div>
                        <span className="block text-sm font-semibold text-slate-800">{b.name}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">ID: #{b.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Nationalized Column */}
                  <td className="p-3">
                    <BoolBadge value={b.isNationalize} activeLabel="Nationalized" activeColor="emerald" />
                  </td>

                  {/* Private Column */}
                  <td className="p-3">
                    <BoolBadge value={b.isPrivate} activeLabel="Private" activeColor="blue" />
                  </td>

                  {/* NBFC Column */}
                  <td className="p-3">
                    <BoolBadge value={b.isnbfc} activeLabel="NBFC" activeColor="purple" />
                  </td>

                  {/* Actions Column */}
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openView(b)}
                        className="rounded px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded px-3 py-1 text-xs font-medium bg-yellow-100 hover:bg-yellow-200 text-yellow-800 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ open: true, id: b.id })}
                        className="rounded px-3 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Bank" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Bank / Institution Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="State Bank of India / HDFC Bank"
                className={inputCls}
              />
            </Field>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Institution Classification</label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isNationalize}
                    onChange={(e) => setForm({ ...form, isNationalize: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-700">Nationalized</span>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPrivate}
                    onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Private</span>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isnbfc}
                    onChange={(e) => setForm({ ...form, isnbfc: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-medium text-slate-700">NBFC</span>
                </label>
              </div>
            </div>

            <Field label="Bank Logo (optional)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">Max 3 MB. Supported formats: PNG, JPG, SVG.</p>
            </Field>

            <ModalFooter
              onCancel={() => setShowAdd(false)}
              submitLabel="Create Bank"
              submitClass="bg-blue-600 hover:bg-blue-700 text-white"
            />
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {showEdit && active && (
        <Modal title="Edit Bank" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Bank / Institution Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </Field>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Institution Classification</label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isNationalize}
                    onChange={(e) => setForm({ ...form, isNationalize: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-700">Nationalized</span>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPrivate}
                    onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Private</span>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isnbfc}
                    onChange={(e) => setForm({ ...form, isnbfc: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-medium text-slate-700">NBFC</span>
                </label>
              </div>
            </div>

            <Field label="Bank Logo">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-400">Choose a file to replace existing logo.</p>
                </div>
                <div className="flex-shrink-0">
                  {form.logo ? (
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={`${API_BASE_URL}/static/bank-logo-images/${form.logo}`}
                        alt="current"
                        className="h-16 w-28 rounded-xl object-contain border p-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveLogo(true)
                          setForm({ ...form, logo: '' })
                          setSelectedFile(null)
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <BankLogo logo={undefined} name={active.name} size="md" />
                  )}
                </div>
              </div>
            </Field>

            <ModalFooter
              onCancel={() => setShowEdit(false)}
              submitLabel="Save Changes"
              submitClass="bg-yellow-500 hover:bg-yellow-600 text-white"
            />
          </form>
        </Modal>
      )}

      {/* ── View Modal ──────────────────────────────────────────────────── */}
      {showView && active && (
        <Modal title="Bank Details" onClose={() => setShowView(false)}>
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100 text-center">
            <BankLogo logo={active.logo} name={active.name} size="lg" />
            <div>
              <div className="text-lg font-bold text-slate-800">{active.name}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">ID: #{active.id}</div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <ViewRow label="Bank Name" value={active.name} />
            <ViewRow
              label="Nationalized Bank"
              value={<BoolBadge value={active.isNationalize} activeLabel="Yes (Nationalized)" activeColor="emerald" />}
            />
            <ViewRow
              label="Private Bank"
              value={<BoolBadge value={active.isPrivate} activeLabel="Yes (Private)" activeColor="blue" />}
            />
            <ViewRow
              label="NBFC Institution"
              value={<BoolBadge value={active.isnbfc} activeLabel="Yes (NBFC)" activeColor="purple" />}
            />
            {active.logo && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Logo Preview</div>
                <img
                  src={`${API_BASE_URL}/static/bank-logo-images/${active.logo}`}
                  alt={active.name}
                  className="mt-1 max-h-24 rounded-xl border p-2 object-contain bg-slate-50"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowView(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">🗑️</span>
              <h3 className="text-lg font-semibold text-slate-800">Delete Bank</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete this bank? All associated bank documents and links may also be affected.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete({ open: false })}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reusable Modal Helpers ────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function ViewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  )
}

function ModalFooter({
  onCancel,
  submitLabel,
  submitClass,
}: {
  onCancel: () => void
  submitLabel: string
  submitClass: string
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
      >
        Cancel
      </button>
      <button type="submit" className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${submitClass}`}>
        {submitLabel}
      </button>
    </div>
  )
}

