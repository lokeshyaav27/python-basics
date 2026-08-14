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

export default function BanksPage() {
  const qc = useQueryClient()
  const { data: banks = [], isLoading } = useQuery<Bank[]>({ queryKey: ['admin-banks'], queryFn: fetchBanks })

  const createMut = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      qc.invalidateQueries(['admin-banks'])
      message.success('Bank created')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to create bank')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateBank(id, payload),
    onSuccess: () => {
      qc.invalidateQueries(['admin-banks'])
      message.success('Bank updated')
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update bank')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBank(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-banks'])
      message.success('Bank deleted')
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

  const [form, setForm] = useState({ name: '', isNationalize: false, isPrivate: false, isnbfc: false, logo: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  function validateFileSize(file: File) {
    const max = 3 * 1024 * 1024
    return file.size <= max
  }


  function openAdd() {
    setForm({ name: '', isNationalize: false, isPrivate: false, isnbfc: false, logo: '' })
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

  const [removeLogo, setRemoveLogo] = useState(false)

  function openView(b: Bank) {
    setActive(b)
    setShowView(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (selectedFile) {
      if (!validateFileSize(selectedFile)) {
        alert('logo must be <= 3MB')
        return
      }
    }

    await createMut.mutateAsync({ name: form.name, isNationalize: form.isNationalize, isPrivate: form.isPrivate, isnbfc: form.isnbfc, file: selectedFile })
    setShowAdd(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    await updateMut.mutateAsync({ id: active.id, payload: { name: form.name, isNationalize: form.isNationalize, isPrivate: form.isPrivate, isnbfc: form.isnbfc, file: selectedFile, remove_logo: removeLogo } })
    setShowEdit(false)
  }

  async function handleDelete() {
    if (!confirmDelete.id) return
    await deleteMut.mutateAsync(confirmDelete.id)
    setConfirmDelete({ open: false })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banks</h2>
          <p className="text-sm text-slate-600">Manage banks and logos</p>
        </div>
        <div>
          <button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700">Add Bank</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full table-auto">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Types</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-sm text-slate-500">Loading...</td>
              </tr>
            ) : banks.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-sm text-slate-500">No banks found.</td>
              </tr>
            ) : (
              banks.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3 text-sm text-slate-700 flex items-center gap-3">
                    {b.logo ? (
                      <img src={`${API_BASE_URL}/static/bank-logo-images/${b.logo}`} alt={b.name} className="h-8 object-contain" />
                    ) : (
                      <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">No</div>
                    )}
                    <div>{b.name}</div>
                  </td>
                  <td className="p-3 text-sm text-slate-700">
                    <div className="text-xs text-slate-600">
                      {b.isNationalize ? 'National' : ''} {b.isPrivate ? ' Private' : ''} {b.isnbfc ? ' NBFC' : ''}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-700">
                    <div className="flex gap-2">
                      <button onClick={() => openView(b)} className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">View</button>
                      <button onClick={() => openEdit(b)} className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200">Edit</button>
                      <button onClick={() => setConfirmDelete({ open: true, id: b.id })} className="px-3 py-1 rounded bg-red-100 hover:bg-red-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Add Bank</h3>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isNationalize} onChange={(e) => setForm({ ...form, isNationalize: e.target.checked })} /> National</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} /> Private</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isnbfc} onChange={(e) => setForm({ ...form, isnbfc: e.target.checked })} /> NBFC</label>
              </div>
              <div>
                <label className="block text-sm font-medium">Logo (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Edit Bank</h3>
            <form onSubmit={handleEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border px-3 py-2" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isNationalize} onChange={(e) => setForm({ ...form, isNationalize: e.target.checked })} /> National</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} /> Private</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isnbfc} onChange={(e) => setForm({ ...form, isnbfc: e.target.checked })} /> NBFC</label>
              </div>
              <div>
                <label className="block text-sm font-medium">Logo</label>
                <div className="flex items-start gap-4">
                  <div>
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                    <div className="text-xs text-slate-500">Choose a file to replace existing logo.</div>
                  </div>
                  <div>
                    {form.logo ? (
                      <div className="flex flex-col items-start">
                        <img src={`${API_BASE_URL}/static/bank-logo-images/${form.logo}`} alt="current" className="h-24 object-contain border" />
                        <button type="button" onClick={() => { setRemoveLogo(true); setForm({ ...form, logo: '' }); setSelectedFile(null); }} className="mt-2 text-sm text-red-600">Remove logo</button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No current logo</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-yellow-600 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">View Bank</h3>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-600">Name</div>
                <div className="text-slate-800">{active.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Types</div>
                <div className="text-slate-800">{active.isNationalize ? 'National' : ''} {active.isPrivate ? ' Private' : ''} {active.isnbfc ? ' NBFC' : ''}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Logo</div>
                {active.logo ? (
                  <img src={`${API_BASE_URL}/static/bank-logo-images/${active.logo}`} alt={active.name} className="mt-2 max-h-64 object-contain" />
                ) : (
                  <div className="text-slate-500">No logo</div>
                )}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShowView(false)} className="px-4 py-2 rounded border">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Confirm delete</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to delete this bank?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete({ open: false })} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
