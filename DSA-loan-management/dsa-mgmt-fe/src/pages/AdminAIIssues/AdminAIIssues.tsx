import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAIIssues,
  updateAIIssueStatus,
  AIIssueReportItem,
} from '../../services/aiIssues'
import {
  Table,
  Tag,
  Select,
  Input,
  Modal,
  Drawer,
  message,
  Card,
  Spin,
  Badge,
} from 'antd'
import {
  AuditOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  RobotOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  OPEN: { color: 'blue', label: 'Open' },
  UNDER_REVIEW: { color: 'gold', label: 'Under Review' },
  RESOLVED: { color: 'green', label: 'Resolved' },
  IGNORED: { color: 'default', label: 'Ignored' },
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  CRITICAL: { color: 'red', label: 'Critical' },
  HIGH: { color: 'volcano', label: 'High' },
  MEDIUM: { color: 'orange', label: 'Medium' },
  LOW: { color: 'cyan', label: 'Low' },
}

const CATEGORY_LABELS: Record<string, string> = {
  INACCURATE_CALCULATION: '🧮 Inaccurate Calculation',
  POLICY_MISMATCH: '🏦 Bank Policy Mismatch',
  INSUFFICIENT_ANSWER: '⚠️ Insufficient Answer',
  HALLUCINATION: '🚫 Hallucination',
  OUTDATED_RATES: '📉 Outdated Rates/Fees',
  OTHER: '📝 Other Concern',
}

const AdminAIIssues: React.FC = () => {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedIssue, setSelectedIssue] = useState<AIIssueReportItem | null>(null)
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [newStatus, setNewStatus] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-issues', statusFilter, severityFilter, searchQuery],
    queryFn: () =>
      fetchAIIssues({
        status: statusFilter,
        severity: severityFilter,
        search: searchQuery || undefined,
      }),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      updateAIIssueStatus(id, { status, adminNotes: notes }),
    onSuccess: (updated) => {
      message.success(`Issue #${updated.id} status updated to ${updated.status}`)
      qc.invalidateQueries({ queryKey: ['admin-ai-issues'] })
      setSelectedIssue(updated)
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update issue status')
    },
  })

  const handleOpenDetail = (item: AIIssueReportItem) => {
    setSelectedIssue(item)
    setNewStatus(item.status)
    setAdminNotes(item.adminNotes || '')
  }

  const handleSaveStatus = async () => {
    if (!selectedIssue) return
    await updateStatusMut.mutateAsync({
      id: selectedIssue.id,
      status: newStatus,
      notes: adminNotes.trim() || undefined,
    })
  }

  const stats = data?.stats || {
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    highOrCritical: 0,
  }

  const issuesList = data?.issues || []

  const columns = [
    {
      title: 'Reported At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (val: string) => (
        <span className="text-xs text-slate-500 font-mono">
          {val ? new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Reporter',
      key: 'reporter',
      width: 160,
      render: (_: any, r: AIIssueReportItem) => (
        <div>
          <div className="font-bold text-xs text-slate-900">{r.userName || 'User'}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                r.userRole === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : r.userRole === 'agent'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {r.userRole}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Flagged Query & Category',
      key: 'queryAndCat',
      render: (_: any, r: AIIssueReportItem) => (
        <div className="max-w-md space-y-1">
          <span className="text-xs font-semibold text-slate-800 line-clamp-1">
            "{r.userQuery}"
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-medium text-purple-900">
              {CATEGORY_LABELS[r.issueCategory] || r.issueCategory}
            </span>
            {r.userRemarks && (
              <span className="text-slate-400 italic line-clamp-1">
                • Note: {r.userRemarks}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'aiSeverity',
      key: 'aiSeverity',
      width: 100,
      render: (sev: string) => {
        const conf = SEVERITY_CONFIG[sev] || { color: 'default', label: sev }
        return <Tag color={conf.color} className="font-bold text-[10px]">{conf.label}</Tag>
      },
    },
    {
      title: 'AI Root Cause Diagnosis',
      dataIndex: 'aiRootCause',
      key: 'aiRootCause',
      render: (val: string) => (
        <span className="text-xs text-slate-600 line-clamp-2 italic">
          {val || 'Under review'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (st: string) => {
        const conf = STATUS_CONFIG[st] || { color: 'default', label: st }
        return <Tag color={conf.color} className="font-bold text-[10px]">{conf.label}</Tag>
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      render: (_: any, r: AIIssueReportItem) => (
        <button
          onClick={() => handleOpenDetail(r)}
          className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 hover:text-purple-900 transition"
        >
          <EyeOutlined /> Audit
        </button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AuditOutlined className="text-purple-600" /> AI Underwriting Quality & Issue Audits
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review reported AI responses, inspect automated root-cause diagnostics, and manage remediation status.
          </p>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Reports</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <ClockCircleOutlined /> Open Issues
          </div>
          <div className="text-2xl font-extrabold text-blue-950 mt-1">{stats.open}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <ExclamationCircleOutlined /> Under Review
          </div>
          <div className="text-2xl font-extrabold text-amber-950 mt-1">{stats.underReview}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <CheckCircleOutlined /> Resolved
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 mt-1">{stats.resolved}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <WarningOutlined /> High / Critical
          </div>
          <div className="text-2xl font-extrabold text-rose-950 mt-1">{stats.highOrCritical}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            placeholder="Search query, user, or diagnosis..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl"
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            className="w-36"
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'OPEN', label: '🔵 Open' },
              { value: 'UNDER_REVIEW', label: '🟡 Under Review' },
              { value: 'RESOLVED', label: '🟢 Resolved' },
              { value: 'IGNORED', label: '⚪ Ignored' },
            ]}
          />

          <Select
            value={severityFilter}
            onChange={(v) => setSeverityFilter(v)}
            className="w-36"
            options={[
              { value: 'ALL', label: 'All Severities' },
              { value: 'CRITICAL', label: '🔴 Critical' },
              { value: 'HIGH', label: '🟠 High' },
              { value: 'MEDIUM', label: '🟡 Medium' },
              { value: 'LOW', label: '🔵 Low' },
            ]}
          />
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={issuesList}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </div>

      {/* Detailed Audit Drawer */}
      <Drawer
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        width={720}
        title={
          <div className="flex items-center justify-between pr-4">
            <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <AuditOutlined className="text-purple-600" />
              AI Quality Audit Dossier #{selectedIssue?.id}
            </span>
            {selectedIssue && (
              <div className="flex items-center gap-2">
                <Tag color={SEVERITY_CONFIG[selectedIssue.aiSeverity]?.color} className="font-bold">
                  {selectedIssue.aiSeverity} Severity
                </Tag>
                <Tag color={STATUS_CONFIG[selectedIssue.status]?.color} className="font-bold">
                  {selectedIssue.status}
                </Tag>
              </div>
            )}
          </div>
        }
      >
        {selectedIssue && (
          <div className="space-y-6 text-xs">
            {/* Section 1: User & Context Dossier */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Incident Metadata & Reporter
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">User</span>
                  <span className="font-bold text-slate-800">{selectedIssue.userName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Role</span>
                  <span className="font-bold uppercase text-purple-700">{selectedIssue.userRole}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email / Mobile</span>
                  <span className="text-slate-700 font-mono text-[11px] block">{selectedIssue.userEmail || selectedIssue.userMobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                  <span className="font-bold text-rose-800">{CATEGORY_LABELS[selectedIssue.issueCategory] || selectedIssue.issueCategory}</span>
                </div>
              </div>

              {selectedIssue.userRemarks && (
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <strong className="text-slate-900 font-bold">User Feedback:</strong> {selectedIssue.userRemarks}
                </div>
              )}
            </div>

            {/* Section 2: AI Diagnostic Analysis & Remediation */}
            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <RobotOutlined /> 2. Automated AI Diagnostic & Remediation Report
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-bold text-purple-900 block text-xs">Root Cause Diagnosis:</span>
                  <p className="text-slate-800 text-xs mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-purple-100">
                    {selectedIssue.aiRootCause || 'No root cause identified.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-purple-900 block text-xs">Actionable Remediation Suggestion:</span>
                  <p className="text-slate-800 text-xs mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-purple-100">
                    {selectedIssue.aiSuggestion || 'Review prompt and underlying RAG documents.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Flagged Conversation Turn */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Flagged Conversation Turn
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                  <UserOutlined /> User Prompt
                </div>
                <div className="text-xs font-medium text-slate-900 whitespace-pre-wrap">
                  {selectedIssue.userQuery}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                  <RobotOutlined /> Flagged AI Response
                </div>
                <div className="text-xs text-slate-800 whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-3 rounded-xl max-h-60 overflow-y-auto">
                  {selectedIssue.aiResponse}
                </div>
              </div>

              {selectedIssue.referencedDocs && selectedIssue.referencedDocs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <FileTextOutlined /> Referenced Documents:
                  </span>
                  {selectedIssue.referencedDocs.map((d, i) => (
                    <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-[10px]">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Admin Status Lifecycle Management */}
            <div className="rounded-2xl border border-slate-300 bg-slate-100/70 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Administrative Resolution & Status
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lifecycle Status
                  </label>
                  <Select
                    value={newStatus}
                    onChange={(v) => setNewStatus(v)}
                    className="w-full"
                    options={[
                      { value: 'OPEN', label: '🔵 Open' },
                      { value: 'UNDER_REVIEW', label: '🟡 Under Review' },
                      { value: 'RESOLVED', label: '🟢 Resolved' },
                      { value: 'IGNORED', label: '⚪ Ignored' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Resolution Notes
                  </label>
                  <Input.TextArea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Document resolution or prompt changes made..."
                    rows={2}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={updateStatusMut.isPending}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {updateStatusMut.isPending ? 'Saving...' : 'Save Audit Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default AdminAIIssues
