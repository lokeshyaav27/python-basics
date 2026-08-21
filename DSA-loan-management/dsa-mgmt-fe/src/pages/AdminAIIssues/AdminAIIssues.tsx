import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAIIssues,
  AIIssueReportItem,
} from '../../services/aiIssues'
import {
  Table,
  Input,
  Drawer,
} from 'antd'
import {
  AuditOutlined,
  SearchOutlined,
  EyeOutlined,
  RobotOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
} from '@ant-design/icons'

const AdminAIIssues: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedIssue, setSelectedIssue] = useState<AIIssueReportItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-issues', searchQuery],
    queryFn: () =>
      fetchAIIssues({
        search: searchQuery || undefined,
      }),
  })

  const handleOpenDetail = (item: AIIssueReportItem) => {
    setSelectedIssue(item)
  }

  const issuesList = data?.issues || []
  const totalCount = data?.total || issuesList.length

  const renderFormattedContent = (text: string) => {
    if (!text) return null

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let tableLines: string[] = []
    let inTable = false

    const flushTable = (key: number) => {
      if (tableLines.length === 0) return
      const rows = tableLines
        .filter((l) => l.trim().startsWith('|') && !l.includes('---'))
        .map((l) =>
          l
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim())
        )

      if (rows.length > 0) {
        const [headerRow, ...bodyRows] = rows
        elements.push(
          <div
            key={`table-${key}`}
            className="my-3 overflow-x-auto rounded-2xl border border-purple-200/80 bg-white shadow-2xs"
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/90 border-b border-purple-100 text-purple-950 font-bold">
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="px-3.5 py-2.5">
                      {cell.replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-purple-50/30 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-700 font-medium">
                        {cell.includes('**') ? (
                          <strong className="text-slate-900 font-bold">
                            {cell.replace(/\*\*/g, '')}
                          </strong>
                        ) : cell.includes('✓') ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            {cell}
                          </span>
                        ) : cell.includes('⚠️') ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                            {cell}
                          </span>
                        ) : cell.includes('✕') ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      tableLines = []
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('|')) {
        inTable = true
        tableLines.push(trimmed)
      } else {
        if (inTable) {
          flushTable(idx)
          inTable = false
        }
        if (trimmed.startsWith('###')) {
          elements.push(
            <h5
              key={idx}
              className="text-xs font-bold uppercase tracking-wider text-purple-950 mt-3.5 mb-1"
            >
              {trimmed.replace(/^###\s*/, '')}
            </h5>
          )
        } else if (trimmed.startsWith('- **') || trimmed.startsWith('**')) {
          elements.push(
            <p key={idx} className="my-1 leading-relaxed text-slate-800">
              {trimmed.split('**').map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="font-bold text-purple-950">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          )
        } else if (trimmed.length > 0) {
          elements.push(
            <p key={idx} className="my-1 text-slate-700 leading-relaxed">
              {trimmed}
            </p>
          )
        }
      }
    })

    if (inTable) {
      flushTable(lines.length)
    }

    return <div className="space-y-1">{elements}</div>
  }

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => (
        <span className="text-xs font-mono font-bold text-slate-500">#{id}</span>
      ),
    },
    {
      title: 'Reporter',
      key: 'reporter',
      width: 170,
      render: (_: any, r: AIIssueReportItem) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
            <UserOutlined />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">{r.userName || 'User'}</div>
            {r.userId && (
              <div className="text-[10px] text-slate-400 font-mono">UID: {r.userId}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Flagged Query & User Feedback',
      key: 'queryAndFeedback',
      render: (_: any, r: AIIssueReportItem) => (
        <div className="max-w-md space-y-1">
          <div className="text-xs font-semibold text-slate-800 line-clamp-1">
            "{r.userQuery}"
          </div>
          {r.userRemarks && (
            <div className="text-[11px] text-rose-700 italic line-clamp-1">
              Feedback: {r.userRemarks}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'AI Root Cause Diagnosis',
      dataIndex: 'aiRootCause',
      key: 'aiRootCause',
      render: (val: string) => (
        <span className="text-xs text-slate-600 line-clamp-2 italic">
          {val || 'Under automated analysis'}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      render: (_: any, r: AIIssueReportItem) => (
        <button
          onClick={() => handleOpenDetail(r)}
          className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 hover:text-purple-900 transition cursor-pointer"
        >
          <EyeOutlined /> Details
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
            Review reported AI assistant responses and inspect automated root-cause diagnostics.
          </p>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Input
            placeholder="Search query, feedback, or diagnosis..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 rounded-xl"
            allowClear
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Total Reports: <span className="text-purple-700 font-extrabold">{totalCount}</span>
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
        width={740}
        title={
          <div className="flex items-center justify-between pr-4">
            <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <AuditOutlined className="text-purple-600" />
              AI Quality Audit Dossier #{selectedIssue?.id}
            </span>
          </div>
        }
      >
        {selectedIssue && (
          <div className="space-y-6 text-xs">
            {/* Section 1: User & Context Dossier */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Reporter & Feedback
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">User</span>
                  <span className="font-bold text-slate-800">{selectedIssue.userName || 'User'}</span>
                </div>
                {selectedIssue.userId && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">User ID</span>
                    <span className="font-mono text-slate-700 font-bold">{selectedIssue.userId}</span>
                  </div>
                )}
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

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1 border-b border-slate-100 pb-2">
                  <RobotOutlined /> Flagged AI Response
                </div>
                <div className="text-xs text-slate-800 leading-relaxed max-h-96 overflow-y-auto pr-1">
                  {renderFormattedContent(selectedIssue.aiResponse)}
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

            {/* Section 4: Full Chat History Transcript */}
            {selectedIssue.chatHistory && selectedIssue.chatHistory.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MessageOutlined /> 4. Full Conversation History Transcript ({selectedIssue.chatHistory.length} messages)
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 max-h-96 overflow-y-auto">
                  {selectedIssue.chatHistory.map((item, idx) => {
                    const isUser = item.role === 'user'
                    return (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white text-[10px] shrink-0 mt-0.5">
                            <RobotOutlined />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                            isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase mb-1 opacity-75">
                            {isUser ? 'User' : 'Assistant'}
                          </div>
                          <div className="text-xs">
                            {isUser ? (
                              <div className="whitespace-pre-wrap">{item.content}</div>
                            ) : (
                              renderFormattedContent(item.content)
                            )}
                          </div>
                        </div>
                        {isUser && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-700 text-white text-[10px] shrink-0 mt-0.5">
                            <UserOutlined />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default AdminAIIssues
