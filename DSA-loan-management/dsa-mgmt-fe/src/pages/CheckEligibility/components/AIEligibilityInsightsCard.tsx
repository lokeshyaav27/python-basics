import React from 'react'

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

  return (
    <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-blue-50/50 p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <h3 className="text-sm font-bold text-purple-950">AI Underwriting Insights</h3>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-2xl border border-purple-100">
        {content}
      </p>
      {disclaimer && <p className="text-[10px] text-slate-400 italic">⚠️ {disclaimer}</p>}
    </div>
  )
}

export default AIEligibilityInsightsCard
