import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://bceufwigavzxfbbplruc.supabase.co' || 
      supabaseUrl.trim() === '' ||
      !supabaseUrl.startsWith('http')) {
    return null
  }

  try {
    return createServerComponentClient({ cookies })
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    return null
  }
}
