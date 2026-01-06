interface ConceptCardProps {
  concept: string
  example: string
  takeaway: string
  topic?: string
}

export default function ConceptCard({ concept, example, takeaway, topic }: ConceptCardProps) {
  return (
    <div className="genz-card p-6 my-4 border-[var(--border-soft)] animate-slide-up">
      {topic && (
        <div className="text-xs font-semibold text-[var(--accent-primary)] mb-3 uppercase tracking-wide">
          ⏱️ 2-Minute Concept: {topic}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Concept:</div>
          <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{concept}</p>
        </div>
        
        {example && (
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Example:</div>
            <p className="text-[var(--text-primary)] italic genz-card rounded-xl px-4 py-3 border-l-4 border-[var(--accent-secondary)]">
              {example}
            </p>
          </div>
        )}
        
        {takeaway && (
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Takeaway:</div>
            <p className="text-[var(--text-primary)] font-bold text-base genz-card rounded-xl px-4 py-3 border-l-4 border-[var(--accent-warm)]">
              {takeaway}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
