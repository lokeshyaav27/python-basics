import React from 'react'
import { RobotOutlined } from '@ant-design/icons'

interface AIEligibilityInsightsCardProps {
  explanation?: string
  insights?: string
  disclaimer?: string
}

export const AIEligibilityInsightsCard: React.FC<AIEligibilityInsightsCardProps> = ({
  explanation,
  insights,
  disclaimer,
}) => {
  const content = explanation || insights
  if (!content) return null

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

  return (
    <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-blue-50/50 p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-600 text-white text-sm shadow-xs">
          <RobotOutlined />
        </span>
        <h3 className="text-sm font-bold text-purple-950">AI Underwriting Insights</h3>
      </div>
      <div className="text-xs text-slate-700 leading-relaxed bg-white/90 p-4 rounded-2xl border border-purple-100/80 shadow-2xs">
        {renderFormattedContent(content)}
      </div>
      {disclaimer && <p className="text-[10px] text-slate-400 italic">⚠️ {disclaimer}</p>}
    </div>
  )
}

export default AIEligibilityInsightsCard

