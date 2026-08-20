import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { MailOutlined, PhoneOutlined, SaveOutlined } from '@ant-design/icons'
import { ContactEnquiry } from '../../../services/contact'

interface EnquiryDetailModalProps {
  enquiry: ContactEnquiry | null
  onClose: () => void
  onUpdateStatus: (id: number, status: string, adminComment?: string) => void
  isUpdating: boolean
}

export const EnquiryDetailModal: React.FC<EnquiryDetailModalProps> = ({
  enquiry,
  onClose,
  onUpdateStatus,
  isUpdating,
}) => {
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('new')

  useEffect(() => {
    if (enquiry) {
      setComment(enquiry.adminComment || '')
      setStatus(enquiry.status || 'new')
    }
  }, [enquiry])

  if (!enquiry) return null

  const handleSave = () => {
    onUpdateStatus(enquiry.id, status, comment)
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span>📬 Contact Enquiry #{enquiry.id}</span>
        </div>
      }
      open={!!enquiry}
      onCancel={onClose}
      footer={[
        <button
          key="close"
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          Close
        </button>,
        <button
          key="save"
          type="button"
          onClick={handleSave}
          disabled={isUpdating}
          className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-md disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <SaveOutlined /> {isUpdating ? 'Saving…' : 'Save Changes'}
        </button>,
      ]}
      className="rounded-3xl"
    >
      <div className="space-y-4 py-3 text-xs sm:text-sm">
        {/* Customer Overview */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 text-xs block">Customer Name</span>
            <span className="font-bold text-slate-800">{enquiry.name}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Loan Interest</span>
            <span className="font-bold text-blue-600">{enquiry.loanType || 'General'}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Email Address</span>
            <a
              href={`mailto:${enquiry.email}`}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <MailOutlined /> {enquiry.email}
            </a>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Mobile Number</span>
            <a
              href={`tel:${enquiry.mobile}`}
              className="text-slate-800 font-mono font-medium flex items-center gap-1"
            >
              <PhoneOutlined /> {enquiry.mobile}
            </a>
          </div>
        </div>

        {/* Customer Message */}
        <div>
          <span className="text-slate-700 font-bold block mb-1.5">Customer Message / Inquiry:</span>
          <div className="rounded-2xl bg-white p-4 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed text-xs">
            {enquiry.message || <span className="text-slate-400 italic">No message content provided.</span>}
          </div>
        </div>

        {/* Admin Comment Input */}
        <div>
          <span className="text-slate-700 font-bold block mb-1.5">Admin Comments / Internal Notes:</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add internal notes, follow-up remarks, or agent assignment details…"
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white"
          />
        </div>

        {/* Status Selection */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700">Enquiry Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isUpdating}
            className="rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
          >
            <option value="new">🟡 New / Unread</option>
            <option value="in_progress">🔵 In Progress</option>
            <option value="contacted">🟣 Contacted</option>
            <option value="resolved">🟢 Resolved</option>
            <option value="closed">⚪ Closed</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}

export default EnquiryDetailModal
