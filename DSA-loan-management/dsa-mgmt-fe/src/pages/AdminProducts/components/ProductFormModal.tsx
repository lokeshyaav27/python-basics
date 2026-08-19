import React, { useState } from 'react'
import { message } from 'antd'
import { API_BASE_URL } from '../../../constants'

export type Product = {
  id: number
  name: string
  description: string
  image?: string
}

interface ProductFormModalProps {
  title: string
  initialData?: Product | null
  onClose: () => void
  onSubmit: (formData: any) => Promise<void>
}

const inputCls =
  'w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500 transition'

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  title,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [currentImage, setCurrentImage] = useState(initialData?.image || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile && selectedFile.size > 3 * 1024 * 1024) {
      message.error('Image must be ≤ 3 MB')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        description,
        file: selectedFile,
        remove_image: removeImage,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Loan Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home Loan / Car Loan"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of features, eligibility guidelines..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Product Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="text-xs"
            />
            {currentImage && (
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={`${API_BASE_URL}/static/product-images/${currentImage}`}
                  alt="preview"
                  className="h-10 w-16 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRemoveImage(true)
                    setCurrentImage('')
                    setSelectedFile(null)
                  }}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductFormModal
