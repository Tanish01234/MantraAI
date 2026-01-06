import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Page Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-gradient-to-r from-[var(--primary)] to-[#3B82F6] hover:from-[#2563EB] hover:to-[var(--primary)] text-white font-semibold py-3 px-6 rounded-xl inline-block transition-all duration-300 shadow-lg shadow-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
