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

    const { currentEducation, interests, strengths, goals } = await request.json()

    if (!currentEducation || !interests || !strengths) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `Based on the following information about a student, provide career guidance and a learning roadmap in simple Hinglish:

Current Education: ${currentEducation}
Interests: ${interests}
Strengths: ${strengths}
${goals ? `Career Goals: ${goals}` : ''}

Please provide:
1. 3-5 suitable career options based on their profile
2. A step-by-step learning roadmap for each option
3. Skills they should develop
4. Next immediate steps they should take
5. Resources or courses they should consider

Make it practical, encouraging, and relevant to the Indian job market.`

    const messages = [
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    const roadmap = await getChatCompletion(messages, 'career')

    return NextResponse.json({ roadmap })
  } catch (error: any) {
    console.error('Career API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate roadmap' },
      { status: 500 }
    )
  }
}
