import React from 'react'
import { Modal } from 'antd'
import { MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { ContactEnquiry } from '../../../services/contact'

interface EnquiryDetailModalProps {
  enquiry: ContactEnquiry | null
  onClose: () => void
  onUpdateStatus: (id: number, status: string) => void
  isUpdating: boolean
}

export const EnquiryDetailModal: React.FC<EnquiryDetailModalProps> = ({
  enquiry,
  onClose,
  onUpdateStatus,
  isUpdating,
}) => {
  if (!enquiry) return null

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
          className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Close
        </button>,
      ]}
      className="rounded-3xl"
    >
      <div className="space-y-4 py-3 text-xs sm:text-sm">
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

        <div>
          <span className="text-slate-500 font-semibold block mb-1.5">Inquiry Message:</span>
          <div className="rounded-2xl bg-white p-4 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
            {enquiry.message || 'No message content provided.'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-semibold text-slate-700">Update Status:</span>
          <select
            value={enquiry.status || 'new'}
            onChange={(e) => onUpdateStatus(enquiry.id, e.target.value)}
            disabled={isUpdating}
            className="rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
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
