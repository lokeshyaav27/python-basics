import React, { useState } from 'react'
import { message } from 'antd'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons'
import { uploadBankProductDocument } from '../../../services/banks'

interface InlineDocUploaderProps {
  bankId: number
  productId: number
  onUploaded: () => void
}

export const InlineDocUploader: React.FC<InlineDocUploaderProps> = ({
  bankId,
  productId,
  onUploaded,
}) => {
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      message.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    try {
      await uploadBankProductDocument(
        bankId,
        productId,
        uploadFile,
        docTitle.trim() || uploadFile.name
      )
      message.success('Document uploaded successfully')
      setUploadFile(null)
      setDocTitle('')
      setShowUpload(false)
      onUploaded()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  if (!showUpload) {
    return (
      <button
        type="button"
        onClick={() => setShowUpload(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-1"
      >
        <PlusOutlined className="text-[10px]" /> Upload New Document
      </button>
    )
  }

  return (
    <form
      onSubmit={handleUpload}
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
            setShowUpload(false)
            setUploadFile(null)
            setDocTitle('')
          }}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading || !uploadFile}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <UploadOutlined /> {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  )
}

export default InlineDocUploader
