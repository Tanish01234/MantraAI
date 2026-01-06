import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    const redirectUrl = new URL('/auth/login', requestUrl.origin)
    if (error === 'expired_token') {
      redirectUrl.searchParams.set('error', 'expired')
      redirectUrl.searchParams.set('message', 'Confirmation link expired. Please request a new one.')
    } else {
      redirectUrl.searchParams.set('error', error)
      redirectUrl.searchParams.set('message', errorDescription || 'Authentication failed')
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Handle email confirmation code
  if (code) {
    try {
      const supabase = createServerComponentClient({ cookies })
      
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        const redirectUrl = new URL('/auth/login', requestUrl.origin)
        redirectUrl.searchParams.set('error', 'exchange_failed')
        redirectUrl.searchParams.set('message', exchangeError.message || 'Failed to confirm email')
        return NextResponse.redirect(redirectUrl)
      }

      if (data.session) {
        // Successfully authenticated - redirect to dashboard
        const redirectUrl = new URL('/dashboard', requestUrl.origin)
        redirectUrl.searchParams.set('confirmed', 'true')
        return NextResponse.redirect(redirectUrl)
      } else {
        // No session created - might need to login
        const redirectUrl = new URL('/auth/login', requestUrl.origin)
        redirectUrl.searchParams.set('confirmed', 'true')
        redirectUrl.searchParams.set('message', 'Email confirmed! Please login.')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err: any) {
      console.error('Callback error:', err)
      const redirectUrl = new URL('/auth/login', requestUrl.origin)
      redirectUrl.searchParams.set('error', 'callback_error')
      redirectUrl.searchParams.set('message', err.message || 'An error occurred during confirmation')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
