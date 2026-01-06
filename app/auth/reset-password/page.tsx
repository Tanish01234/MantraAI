'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!supabase) {
        setError('Authentication is not configured.')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message || 'Failed to send reset email')
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full genz-card p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent mb-2">Reset Password</h1>
          <p className="text-[var(--text-secondary)]">Enter your email to receive a password reset link</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="genz-card border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl">
              ✅ Password reset email sent! Please check your inbox and follow the instructions.
            </div>
            <Link
              href="/auth/login"
              className="block w-full text-center btn-primary"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            {error && (
              <div className="genz-card border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 genz-input"
                placeholder="your.email@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Remember your password?{' '}
          <Link href="/auth/login" className="text-[var(--accent-primary)] hover:underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
