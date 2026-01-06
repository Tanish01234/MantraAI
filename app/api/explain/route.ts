import { NextRequest, NextResponse } from 'next/server'
import { getChatCompletion } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    // Only check auth if Supabase is configured
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

    const messages = [
      {
        role: 'user' as const,
        content: `Please explain the following study material in simple Hinglish. Break it down into easy-to-understand points with examples:\n\n${content.substring(0, 3000)}`
      }
    ]

    const explanation = await getChatCompletion(messages, 'study')

    return NextResponse.json({ explanation })
  } catch (error: any) {
    console.error('Explain API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
