'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Check URL parameters and handle auth state
  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return

    const params = new URLSearchParams(window.location.search)
    const signupSuccess = params.get('signup')
    const confirmed = params.get('confirmed')
    const errorParam = params.get('error')
    const messageParam = params.get('message')
    const redirectPath = params.get('redirect')

    // Handle signup success
    if (signupSuccess === 'success') {
      setError('')
      setTimeout(() => {
        alert('✅ Account created! Please check your email and click the confirmation link to activate your account.')
      }, 100)
      window.history.replaceState(null, '', window.location.pathname)
    }

    // Handle email confirmation success
    if (confirmed === 'true') {
      setError('')
      setTimeout(() => {
        alert('✅ Email confirmed successfully! You can now login.')
      }, 100)
      window.history.replaceState(null, '', window.location.pathname)
    }

    // Handle errors from callback
    if (errorParam) {
      const errorMessage = messageParam ||
        (errorParam === 'expired' ? 'Confirmation link expired. Please request a new one.' :
          errorParam === 'exchange_failed' ? 'Failed to confirm email. Please try again.' :
            'An error occurred during authentication.')
      setError(errorMessage)
      window.history.replaceState(null, '', window.location.pathname)
    }

    // Check if already logged in
    const checkSession = async () => {
      if (!supabase) return
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          return
        }

        if (session) {
          // User is logged in - redirect to dashboard or intended path
          const destination = redirectPath || '/dashboard'
          router.push(destination)
          router.refresh()
        }
      } catch (err) {
        console.error('Error checking session:', err)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const destination = redirectPath || '/dashboard'
        router.push(destination)
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        // Stay on login page
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Session refreshed - ensure user stays logged in
        if (window.location.pathname === '/auth/login') {
          router.push('/dashboard')
          router.refresh()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide user-friendly error messages
        console.log('Login error:', error)

        if (error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials') ||
          error.message.includes('Invalid login')) {
          setError('Invalid email or password. Please check your credentials. If you just confirmed your email, try refreshing the page and logging in again.')
        } else if (error.message.includes('Email not confirmed') ||
          error.message.includes('email_not_confirmed')) {
          setError('Please check your email and confirm your account. If the confirmation link expired, you can request a new one.')
        } else if (error.message.includes('expired') ||
          error.message.includes('otp_expired')) {
          setError('Your confirmation link has expired. Please try logging in directly - your account might already be confirmed.')
        } else {
          setError(error.message || 'Failed to login. Please try again.')
        }
        return
      }

      if (data.user && data.session) {
        // Verify session is properly set
        const { data: { session: verifiedSession }, error: verifyError } = await supabase.auth.getSession()

        if (verifyError || !verifiedSession) {
          setError('Session could not be established. Please try again.')
          setLoading(false)
          return
        }

        // Session is valid - redirect immediately
        const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
        router.push(redirectPath)
        router.refresh()
      } else if (data.user && !data.session) {
        setError('Account exists but session not created. Your email might not be confirmed. Please check your email or try requesting a new confirmation link.')
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err: any) {
      // Handle unexpected errors
      console.error('Login error:', err)
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid_credentials')) {
        setError('Invalid email or password. Please check your credentials or sign up if you don\'t have an account.')
      } else {
        setError(err.message || 'Failed to login. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      <div className="max-w-md w-full glass-panel p-8 animate-fade-in relative z-10 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent mb-2">Welcome Back</h1>
          <p className="text-[var(--text-secondary)]">Login to your MentraAI account</p>
          {!supabase && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-400 px-4 py-2 rounded-xl text-sm">
              ⚠️ Supabase not configured. You'll be redirected to dashboard in demo mode.
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
              className="w-full px-4 py-3 genz-input bg-[var(--bg-surface)]/50 backdrop-blur-sm"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-aurora py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[var(--accent-primary)] hover:underline font-semibold">
              Sign up
            </Link>
          </p>
          {supabase && (
            <div className="text-center">
              <button
                onClick={async () => {
                  if (!email) {
                    setError('Please enter your email first')
                    return
                  }
                  setLoading(true)
                  setError('')
                  try {
                    if (!supabase) {
                      setError('Supabase client is not available')
                      setLoading(false)
                      return
                    }
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: email
                    })
                    if (error) {
                      setError(error.message)
                    } else {
                      setError('✅ New confirmation email sent! Please check your inbox.')
                    }
                  } catch (err: any) {
                    setError(err.message || 'Failed to resend email')
                  } finally {
                    setLoading(false)
                  }
                }}
                className="text-sm text-[var(--accent-primary)] hover:underline font-medium"
                disabled={loading || !email}
              >
                Resend confirmation email
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 text-center">
          <Link href="/auth/reset-password" className="block text-sm text-[var(--accent-primary)] hover:underline font-medium">
            Forgot password?
          </Link>
          <Link href="/" className="block text-sm text-[var(--text-secondary)] hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
