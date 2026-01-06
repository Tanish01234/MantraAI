import { NextRequest, NextResponse } from 'next/server'
import { getChatStream } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai'

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

    const { messages, language, firstName } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // Get the stream from Gemini
    const response = await getChatStream(messages, 'study', language || 'hinglish', firstName)

    // Convert to GoogleGenerativeAIStream
    const stream = GoogleGenerativeAIStream(response)

    // Return a StreamingTextResponse
    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
