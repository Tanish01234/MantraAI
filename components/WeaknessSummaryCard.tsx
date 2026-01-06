interface WeaknessSummaryCardProps {
  weakAreas: string[]
  whyWeak: string
  nextActions: string[]
  confidence: 'high' | 'medium' | 'low'
}

export default function WeaknessSummaryCard({
  weakAreas,
  whyWeak,
  nextActions,
  confidence
}: WeaknessSummaryCardProps) {
  const confidenceColors = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    low: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
  }

  const confidenceBadge = {
    high: '✅ High',
    medium: '⚠️ Medium',
    low: '❗ Low'
  }

  return (
    <div className="genz-card p-6 my-4 border-[var(--border-soft)] animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wide">
          🧠 Weakness Analysis
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${confidenceColors[confidence]}`}>
          {confidenceBadge[confidence]} Confidence
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">❗ Weak Areas:</div>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            {weakAreas.map((area, idx) => (
              <li key={idx} className="text-sm">{area}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">🎯 Why Weak:</div>
          <p className="text-[var(--text-primary)] text-sm genz-card rounded-xl px-4 py-3 border-l-4 border-[var(--accent-warm)]">
            {whyWeak}
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">✅ Next Actions:</div>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            {nextActions.map((action, idx) => (
              <li key={idx} className="text-sm">{action}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
