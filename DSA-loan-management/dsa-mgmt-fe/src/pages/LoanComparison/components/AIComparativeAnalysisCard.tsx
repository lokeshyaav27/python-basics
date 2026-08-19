import React from 'react'

interface AIComparativeAnalysisCardProps {
  analysis?: string
  disclaimer?: string
}

export const AIComparativeAnalysisCard: React.FC<AIComparativeAnalysisCardProps> = ({
  analysis,
  disclaimer,
}) => {
  if (!analysis) return null

  return (
    <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-blue-50/50 p-6 md:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white text-xl shadow-md shadow-purple-600/30">
          🤖
        </div>
        <div>
          <h3 className="text-base font-bold text-purple-950">AI Underwriting Comparative Analysis</h3>
          <p className="text-xs text-purple-700">Synthesized multi-bank policy evaluation for this applicant</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 p-5 border border-purple-100 text-xs md:text-sm text-slate-700 leading-relaxed space-y-2">
        <p className="whitespace-pre-line">{analysis}</p>
      </div>

      {disclaimer && (
        <p className="text-[11px] text-slate-400 italic">
          ⚠️ {disclaimer}
        </p>
      )}
    </div>
  )
}

export default AIComparativeAnalysisCard
