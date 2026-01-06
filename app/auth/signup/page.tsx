'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!supabase) {
        // If Supabase is not configured, allow demo access
        console.warn('Supabase not configured, allowing demo access')
        router.push('/dashboard')
        router.refresh()
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          setError('This email is already registered. Please login instead or use a different email.')
        } else if (error.message.includes('Password')) {
          setError('Password is too weak. Please use a stronger password (at least 6 characters).')
        } else {
          setError(error.message || 'Failed to sign up. Please try again.')
        }
        return
      }

      if (data.user) {
        // Always require email confirmation - don't auto-login
        // Show success message and redirect to login page
        setError('')
        setLoading(false)

        // Show success message
        alert('✅ Account created successfully!\n\n📧 Please check your email inbox and click the confirmation link to activate your account.\n\nAfter confirming, you can login to access MentraAI.')

        // Redirect to login page
        router.push('/auth/login?signup=success')
        return
      } else {
        setError('Sign up failed. Please try again.')
      }
    } catch (err: any) {
      // Handle unexpected errors
      console.error('Signup error:', err)
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please login instead.')
      } else {
        setError(err.message || 'Failed to sign up. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      <div className="max-w-md w-full glass-panel p-8 animate-fade-in relative z-10 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent mb-2">Create Account</h1>
          <p className="text-[var(--text-secondary)]">Start your learning journey with MentraAI</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
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
              className="w-full px-4 py-3 genz-input bg-[var(--bg-surface)]/50 backdrop-blur-sm"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 genz-input bg-[var(--bg-surface)]/50 backdrop-blur-sm"
              placeholder="Enter your password"
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-aurora py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--accent-primary)] hover:underline font-semibold">
            Login
          </Link>
        </p>

        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
