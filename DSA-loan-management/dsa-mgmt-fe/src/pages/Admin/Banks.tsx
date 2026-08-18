import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchBanks,
  createBank,
  updateBank,
  deleteBank,
  fetchBankProducts,
  linkBankProduct,
  uploadBankProductDocument,
  deleteBankProductDocument,
  BankProductLink,
  BankDocumentItem,
} from '../../services/banks'
import { message, Tooltip } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
  SaveOutlined,
  UploadOutlined,
  FileTextOutlined,
  CloseOutlined,
} from '@ant-design/icons'

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
  const [linkModal, setLinkModal] = useState<{ open: boolean; bank: Bank | null }>({ open: false, bank: null })
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

  function openLinkProducts(b: Bank) {
    setLinkModal({ open: true, bank: b })
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
          <p className="text-sm text-slate-500">Manage partner banks, financial institutions, and product linkages</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <PlusOutlined /> Add Bank
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
                    <div className="flex items-center gap-1.5">
                      <Tooltip title="Link Products & Documents">
                        <button
                          onClick={() => openLinkProducts(b)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Link Products"
                        >
                          <LinkOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="View Bank Details">
                        <button
                          onClick={() => openView(b)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="View Details"
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Edit Bank">
                        <button
                          onClick={() => openEdit(b)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Edit Bank"
                        >
                          <EditOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Bank">
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: b.id })}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-sm shadow-2xs hover:scale-105 active:scale-95 transition"
                          aria-label="Delete Bank"
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

      {/* ── Link Products Modal ─────────────────────────────────────────── */}
      {linkModal.open && linkModal.bank && (
        <LinkProductsModal
          bank={linkModal.bank}
          onClose={() => setLinkModal({ open: false, bank: null })}
        />
      )}

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
        <BankViewModal
          bank={active}
          onClose={() => setShowView(false)}
          onOpenLink={() => {
            setShowView(false)
            setLinkModal({ open: true, bank: active })
          }}
        />
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

function Modal({
  title,
  maxWidth = 'max-w-lg',
  children,
  onClose,
}: {
  title: string
  maxWidth?: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl`}>
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

function BankViewModal({
  bank,
  onClose,
  onOpenLink,
}: {
  bank: Bank
  onClose: () => void
  onOpenLink: () => void
}) {
  const { data: products = [], isLoading } = useQuery<BankProductLink[]>({
    queryKey: ['bank-products-view', bank.id],
    queryFn: () => fetchBankProducts(bank.id),
  })

  const mappedProducts = products.filter((p) => p.isLinked)

  return (
    <Modal title="Bank Profile & Mappings" maxWidth="max-w-3xl" onClose={onClose}>
      <div className="space-y-6">
        {/* Bank Header Info Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <BankLogo logo={bank.logo} name={bank.name} size="lg" />
          <div className="text-center sm:text-left flex-1">
            <h4 className="text-xl font-bold text-slate-800">{bank.name}</h4>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Database ID: #{bank.id}</div>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
              <BoolBadge value={bank.isNationalize} activeLabel="Nationalized Bank" activeColor="emerald" />
              <BoolBadge value={bank.isPrivate} activeLabel="Private Bank" activeColor="blue" />
              <BoolBadge value={bank.isnbfc} activeLabel="NBFC Institution" activeColor="purple" />
            </div>
          </div>
        </div>

        {/* Mapped Products & Policy Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📋</span> Mapped Products & Documents ({mappedProducts.length})
            </h5>
            <button
              onClick={onOpenLink}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
            >
              <span>⚙️</span> Manage Mappings
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
              Loading mapped products…
            </div>
          ) : mappedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <span className="text-2xl mb-1 block">📦</span>
              <p className="text-sm font-semibold text-slate-700">No products mapped yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Link loan products and upload policy documents for this bank.
              </p>
              <button
                onClick={onOpenLink}
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                + Link Products Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full table-auto">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-36">DSA Commission</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Policy & Scheme Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {mappedProducts.map((p) => (
                    <tr key={p.productId} className="hover:bg-slate-50 transition">
                      {/* Product Thumbnail & Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {p.productImage ? (
                            <img
                              src={`${API_BASE_URL}/static/product-images/${p.productImage}`}
                              alt={p.productName}
                              className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                              {p.productName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="block text-sm font-semibold text-slate-800">{p.productName}</span>
                            <span className="block text-xs text-slate-400 line-clamp-1 max-w-xs">{p.productDescription}</span>
                          </div>
                        </div>
                      </td>

                      {/* DSA Commission Rate */}
                      <td className="p-3">
                        {p.commission !== null && p.commission !== undefined ? (
                          <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            {p.commission}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not configured</span>
                        )}
                      </td>

                      {/* Policy & Scheme Documents List */}
                      <td className="p-3">
                        {p.documents && p.documents.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {p.documents.map((doc) => (
                              <a
                                key={doc.id || doc.fileName}
                                href={`${API_BASE_URL}/static/bank-documents/${doc.fileName}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
                                title={doc.name}
                              >
                                <span>📄</span>
                                <span className="max-w-[180px] truncate">{doc.name}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No documents uploaded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
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

// ── Link Products Modal ───────────────────────────────────────────────────────

function LinkProductsModal({ bank, onClose }: { bank: Bank; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: products = [], isLoading, refetch } = useQuery<BankProductLink[]>({
    queryKey: ['bank-products', bank.id],
    queryFn: () => fetchBankProducts(bank.id),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <BankLogo logo={bank.logo} name={bank.name} size="md" />
            <div>
              <h3 className="text-lg font-bold text-slate-800">Link Products — {bank.name}</h3>
              <p className="text-xs text-slate-500">Configure loan products, DSA payout commission rates, and bank policy documents</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-xl leading-none transition">
            ✕
          </button>
        </div>

        {/* Modal Body / Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading products & bank linkages…</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No active products available to link.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full table-auto">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-14">Link</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-44">Commission for DSA (%)</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Policy Document</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <ProductLinkRow
                      key={p.productId}
                      bankId={bank.id}
                      item={p}
                      onUpdated={() => {
                        qc.invalidateQueries({ queryKey: ['bank-products', bank.id] })
                        refetch()
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="text-xs text-slate-500">
            ℹ️ Check the box for products offered by this bank. Upload policy guidelines (PDF/DOC) for agent reference.
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductLinkRow({
  bankId,
  item,
  onUpdated,
}: {
  bankId: number
  item: BankProductLink
  onUpdated: () => void
}) {
  const [isLinked, setIsLinked] = useState(item.isLinked)
  const [commission, setCommission] = useState(
    item.commission !== null && item.commission !== undefined ? String(item.commission) : ''
  )
  const [isSaving, setIsSaving] = useState(false)

  // Document upload state
  const [showDocUpload, setShowDocUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  useEffect(() => {
    setIsLinked(item.isLinked)
    setCommission(
      item.commission !== null && item.commission !== undefined ? String(item.commission) : ''
    )
  }, [item])

  async function handleSaveLink() {
    setIsSaving(true)
    try {
      const commNum = commission.trim() === '' ? null : parseFloat(commission)
      if (commission.trim() !== '' && isNaN(commNum!)) {
        message.error('Please enter a valid numeric commission percentage')
        setIsSaving(false)
        return
      }

      await linkBankProduct(bankId, item.productId, {
        is_linked: isLinked,
        commission: commNum,
      })

      message.success(`${item.productName} configuration saved`)
      onUpdated()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to update product link')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile) {
      message.error('Please select a file to upload')
      return
    }

    setIsUploadingDoc(true)
    try {
      await uploadBankProductDocument(bankId, item.productId, uploadFile, docTitle.trim() || uploadFile.name)
      message.success('Document uploaded successfully')
      setUploadFile(null)
      setDocTitle('')
      setShowDocUpload(false)
      onUpdated()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to upload document')
    } finally {
      setIsUploadingDoc(false)
    }
  }

  async function handleDeleteDocument(documentId: number, docName: string) {
    if (!window.confirm(`Delete document "${docName}"?`)) return
    setDeletingDocId(documentId)
    try {
      await deleteBankProductDocument(bankId, item.productId, documentId)
      message.success(`Document "${docName}" removed`)
      onUpdated()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to delete document')
    } finally {
      setDeletingDocId(null)
    }
  }

  const docs = item.documents || []

  return (
    <tr
      className={`transition ${
        isLinked ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'hover:bg-slate-50 opacity-70'
      }`}
    >
      {/* Checkbox */}
      <td className="p-3 text-center align-top pt-4">
        <input
          type="checkbox"
          checked={isLinked}
          onChange={(e) => setIsLinked(e.target.checked)}
          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </td>

      {/* Product Info */}
      <td className="p-3 align-top pt-4">
        <div className="flex items-center gap-3">
          {item.productImage ? (
            <img
              src={`${API_BASE_URL}/static/product-images/${item.productImage}`}
              alt={item.productName}
              className="h-10 w-10 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
              {item.productName.charAt(0)}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-slate-800">{item.productName}</div>
            <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{item.productDescription}</div>
          </div>
        </div>
      </td>

      {/* Commission Input */}
      <td className="p-3 align-top pt-4">
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="e.g. 2.50"
            disabled={!isLinked}
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-400 transition"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
        </div>
      </td>

      {/* Multi-Document Management */}
      <td className="p-3 align-top">
        <div className="space-y-2">
          {/* Document Pills List */}
          {docs.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {docs.map((doc) => (
                <div
                  key={doc.id || doc.fileName}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs hover:border-slate-300 transition"
                >
                  <a
                    href={`${API_BASE_URL}/static/bank-documents/${doc.fileName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-700 font-medium hover:underline truncate"
                    title={doc.name}
                  >
                    <span>📄</span>
                    <span className="truncate max-w-[200px]">{doc.name}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                    disabled={deletingDocId === doc.id}
                    className="text-slate-400 hover:text-red-600 text-xs p-1 rounded hover:bg-red-50 transition"
                    title="Delete document"
                  >
                    {deletingDocId === doc.id ? '…' : <CloseOutlined className="text-[11px]" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No documents attached</div>
          )}

          {/* Inline Upload Toggle & Widget */}
          {isLinked && (
            <div>
              {!showDocUpload ? (
                <button
                  type="button"
                  onClick={() => setShowDocUpload(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-1"
                >
                  <PlusOutlined className="text-[10px]" /> Upload New Document
                </button>
              ) : (
                <form
                  onSubmit={handleUploadDocument}
                  className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5 space-y-2 text-xs"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Document Title / Scheme Name
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Interest Rate Matrix 2026"
                      className="w-full rounded-md border border-slate-300 p-1.5 text-xs bg-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Choose File (PDF/DOC/Image)
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="text-xs w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDocUpload(false)
                        setUploadFile(null)
                        setDocTitle('')
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingDoc || !uploadFile}
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <UploadOutlined /> {isUploadingDoc ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Action Button */}
      <td className="p-3 text-center align-top pt-4">
        <button
          onClick={handleSaveLink}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          <SaveOutlined /> {isSaving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}


