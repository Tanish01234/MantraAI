import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl === 'your_supabase_url_here' ||
    supabaseUrl.trim() === '' ||
    !supabaseUrl.startsWith('http')) {
    console.warn('Supabase is not configured. Some features may be unavailable.')
    return null
  }

  try {
    // Use createClientComponentClient for proper cookie handling
    return createClientComponentClient()
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    return null
  }
}

// Create client with error handling
export const supabase = createSupabaseClient()
