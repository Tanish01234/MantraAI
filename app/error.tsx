'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="bg-gradient-to-r from-[var(--primary)] to-[#3B82F6] hover:from-[#2563EB] hover:to-[var(--primary)] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
