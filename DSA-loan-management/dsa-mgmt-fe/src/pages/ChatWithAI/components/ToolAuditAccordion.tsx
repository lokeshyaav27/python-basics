import React, { useState } from 'react'
import { ToolExecutionAudit } from '../../../services/chat'
import {
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'

interface ToolAuditAccordionProps {
  tool: ToolExecutionAudit
  index: number
}

export const ToolAuditAccordion: React.FC<ToolAuditAccordionProps> = ({ tool, index }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isSuccess = tool.status === 'success'

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            <ToolOutlined />
          </span>
          <span className="font-mono font-bold text-slate-800">{tool.toolName}</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            {tool.status}
          </span>
        </div>
        <span className="text-slate-400 text-xs">
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </span>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 border-t border-slate-100 bg-white">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Tool Arguments
            </span>
            <pre className="rounded-lg bg-slate-50 p-2 text-[11px] font-mono text-slate-700 overflow-x-auto border border-slate-100">
              {JSON.stringify(tool.arguments, null, 2)}
            </pre>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Execution Summary
            </span>
            <p className="text-xs text-slate-600">{tool.summary}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolAuditAccordion
