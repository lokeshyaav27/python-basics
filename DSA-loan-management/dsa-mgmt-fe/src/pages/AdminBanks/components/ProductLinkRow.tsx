import React, { useState, useEffect } from 'react'
import { message, Modal } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { SaveOutlined, CloseOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons'
import {
  BankProductLink,
  linkBankProduct,
  deleteBankProductDocument,
} from '../../../services/banks'
import { API_BASE_URL } from '../../../constants'
import { InlineDocUploader } from './InlineDocUploader'

interface ProductLinkRowProps {
  bankId: number
  item: BankProductLink
  onUpdated: () => void
}

export const ProductLinkRow: React.FC<ProductLinkRowProps> = ({ bankId, item, onUpdated }) => {
  const [isLinked, setIsLinked] = useState(item.isLinked)
  const [commission, setCommission] = useState(
    item.commission !== null && item.commission !== undefined ? String(item.commission) : ''
  )
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  useEffect(() => {
    setIsLinked(item.isLinked)
    setCommission(
      item.commission !== null && item.commission !== undefined ? String(item.commission) : ''
    )
  }, [item])

  const linkMutation = useMutation({
    mutationFn: ({ linked, comm }: { linked: boolean; comm: number | null }) =>
      linkBankProduct(bankId, item.productId, {
        is_linked: linked,
        commission: comm,
      }),
    onSuccess: (_, vars) => {
      if (vars.linked) {
        message.success(`${item.productName} linked and saved successfully`)
      } else {
        message.success(`${item.productName} unlinked from bank`)
      }
      onUpdated()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update product link')
    },
  })

  const deleteDocMutation = useMutation({
    mutationFn: ({ documentId }: { documentId: number; docName: string }) =>
      deleteBankProductDocument(bankId, item.productId, documentId),
    onSuccess: (_, vars) => {
      message.success(`Document "${vars.docName}" removed`)
      onUpdated()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to delete document')
    },
    onSettled: () => {
      setDeletingDocId(null)
    },
  })

  const handleToggleCheckbox = (checked: boolean) => {
    if (!checked && item.isLinked) {
      // User is unlinking an active product
      const hasDocs = (item.documents || []).length > 0
      const warningText = hasDocs
        ? `Are you sure you want to unlink "${item.productName}"? All ${item.documents?.length} attached policy document(s) will also be removed.`
        : `Are you sure you want to unlink "${item.productName}" from this bank?`

      Modal.confirm({
        title: `Unlink ${item.productName}?`,
        content: warningText,
        okText: 'Yes, Unlink',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: () => {
          setIsLinked(false)
          linkMutation.mutate({ linked: false, comm: null })
        },
      })
    } else if (checked && !item.isLinked) {
      // User is checking an unlinked product
      setIsLinked(true)
    } else {
      setIsLinked(checked)
    }
  }

  const handleSaveLink = () => {
    const commNum = commission.trim() === '' ? null : parseFloat(commission)
    if (commission.trim() !== '' && isNaN(commNum!)) {
      message.error('Please enter a valid numeric commission percentage')
      return
    }
    linkMutation.mutate({ linked: isLinked, comm: commNum })
  }

  const handleDirectUnlink = () => {
    const hasDocs = (item.documents || []).length > 0
    const warningText = hasDocs
      ? `Are you sure you want to unlink "${item.productName}"? All ${item.documents?.length} attached policy document(s) will also be removed.`
      : `Are you sure you want to unlink "${item.productName}" from this bank?`

    Modal.confirm({
      title: `Unlink ${item.productName}?`,
      content: warningText,
      okText: 'Yes, Unlink',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setIsLinked(false)
        linkMutation.mutate({ linked: false, comm: null })
      },
    })
  }

  const handleDeleteDocument = (documentId: number, docName: string) => {
    Modal.confirm({
      title: 'Delete Document',
      content: `Are you sure you want to delete "${docName}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setDeletingDocId(documentId)
        deleteDocMutation.mutate({ documentId, docName })
      },
    })
  }

  const docs = item.documents || []

  return (
    <tr
      className={`transition ${
        isLinked ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'hover:bg-slate-50 opacity-60'
      }`}
    >
      {/* Checkbox */}
      <td className="p-3 text-center align-top pt-4">
        <input
          type="checkbox"
          checked={isLinked}
          onChange={(e) => handleToggleCheckbox(e.target.checked)}
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
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              {item.productName}
              {item.isLinked ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Linked
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                  Not Linked
                </span>
              )}
            </div>
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
          {docs.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {docs.map((doc) => {
                const docName = doc.documentName || doc.name || 'Document'
                const docFile = doc.documentLocation || doc.fileName || ''
                return (
                  <div
                    key={doc.id || docFile}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs hover:border-slate-300 transition"
                  >
                    <a
                      href={`${API_BASE_URL}/static/bank-documents/${docFile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-700 font-medium hover:underline truncate"
                      title={docName}
                    >
                      <span>📄</span>
                      <span className="truncate max-w-[200px]">{docName}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, docName)}
                      disabled={deletingDocId === doc.id || deleteDocMutation.isPending}
                      className="text-slate-400 hover:text-red-600 text-xs p-1 rounded hover:bg-red-50 transition cursor-pointer"
                      title="Delete document"
                    >
                      {deletingDocId === doc.id ? '…' : <CloseOutlined className="text-[11px]" />}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No documents attached</div>
          )}

          {isLinked && (
            <InlineDocUploader
              bankId={bankId}
              productId={item.productId}
              onUploaded={onUpdated}
            />
          )}
        </div>
      </td>

      {/* Action Buttons */}
      <td className="p-3 text-center align-top pt-4">
        <div className="flex items-center justify-center gap-1.5">
          {isLinked ? (
            <>
              <button
                type="button"
                onClick={handleSaveLink}
                disabled={linkMutation.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                title="Save Commission Settings"
              >
                <SaveOutlined /> {linkMutation.isPending ? '…' : 'Save'}
              </button>
              {item.isLinked && (
                <button
                  type="button"
                  onClick={handleDirectUnlink}
                  disabled={linkMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition cursor-pointer"
                  title="Unlink this product"
                >
                  <DisconnectOutlined />
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsLinked(true)
                linkMutation.mutate({
                  linked: true,
                  comm: commission ? parseFloat(commission) : null,
                })
              }}
              disabled={linkMutation.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              <LinkOutlined /> {linkMutation.isPending ? '…' : 'Link'}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default ProductLinkRow
