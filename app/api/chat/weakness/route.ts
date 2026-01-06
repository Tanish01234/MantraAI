import { NextRequest, NextResponse } from 'next/server'
import { getCustomChatCompletion } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { messages, language } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Get user's recent interactions from database for better analysis
    let recentHistory = ''
    if (supabase && messages.length > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data } = await supabase
            .from('user_memory')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('interaction_type', 'chat')
            .order('created_at', { ascending: false })
            .limit(20)

          if (data && data.length > 0) {
            recentHistory = data
              .map(m => `${m.role}: ${m.content}`)
              .reverse()
              .join('\n')
          }
        }
      } catch (err) {
        console.error('Error fetching user history:', err)
      }
    }

    const systemPrompt = `You are MentraAI, a student-first learning mentor.
Tone: Honest, supportive mentor. No shaming.

🎯 TASK: Analyze student's weakness from their questions and answers.

Analyze:
- User questions (what they're asking about)
- Ask-Me-Back answers (if available in conversation)
- Topic repetition / confusion patterns
- Concept gaps vs application gaps vs basics gaps

OUTPUT FORMAT (EXACT):
❗ Weak Areas:
- <weakness 1>
- <weakness 2>
- <weakness 3>

🎯 Why Weak:
<brief explanation - concept gap / application gap / basics gap>

✅ Next Actions:
- <action 1>
- <action 2>
- <action 3>

📌 Confidence Level: <High | Medium | Low>

Rules:
- Be honest, no fake confidence
- Actionable steps only
- Supportive, not shaming
- Focus on what to revise next`

    const conversationContext = recentHistory 
      ? `Recent conversation history:\n${recentHistory}\n\nCurrent conversation:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
      : messages.map(m => `${m.role}: ${m.content}`).join('\n')

    const response = await getCustomChatCompletion(
      systemPrompt,
      [{ role: 'user', content: `Analyze weakness from this conversation:\n\n${conversationContext}` }],
      language || 'hinglish'
    )

    // Parse the response to extract structured parts
    const weakAreasMatch = response.match(/❗ Weak Areas:\s*(.+?)(?=🎯|✅|📌|$)/is)
    const whyWeakMatch = response.match(/🎯 Why Weak:\s*(.+?)(?=✅|📌|$)/is)
    const nextActionsMatch = response.match(/✅ Next Actions:\s*(.+?)(?=📌|$)/is)
    const confidenceMatch = response.match(/📌 Confidence Level:\s*(High|Medium|Low)/i)

    const weakAreas = weakAreasMatch 
      ? weakAreasMatch[1].trim().split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
      : []

    const nextActions = nextActionsMatch
      ? nextActionsMatch[1].trim().split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
      : []

    const parsed = {
      weakAreas: weakAreas.length > 0 ? weakAreas : ['Unable to identify specific weak areas from current conversation'],
      whyWeak: whyWeakMatch ? whyWeakMatch[1].trim() : 'Need more interaction data to analyze',
      nextActions: nextActions.length > 0 ? nextActions : ['Continue practicing and asking questions'],
      confidence: confidenceMatch ? confidenceMatch[1].toLowerCase() as 'high' | 'medium' | 'low' : 'medium',
      raw: response
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Weakness Detection API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze weakness' },
      { status: 500 }
    )
  }
}
