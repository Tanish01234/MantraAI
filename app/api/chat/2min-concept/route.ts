import { NextRequest, NextResponse } from 'next/server'
import { getCustomChatCompletion, getStructuredChatCompletion } from '@/lib/openai'
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

    const { topic, language, firstName } = await request.json()

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const nameInstruction = firstName
      ? `\n\nPERSONALIZATION:\n- User's first name: "${firstName}". Use it MAX ONCE, only when greeting.\n- Never overuse.`
      : ''

    const timeGreetingRules = `\n\n🕒 TIME-BASED GREETING (MANDATORY):\n- Detect user's local time automatically\n- Morning (5:00 AM - 11:59 AM): "Good morning" or "Morning 🌤️"\n- Afternoon (12:00 PM - 4:59 PM): "Good afternoon"\n- Evening (5:00 PM - 8:59 PM): "Good evening" or "Evening vibes 🌆"\n- Night (9:00 PM - 4:59 AM): "Good night" or "Late night study? 😴"\n- ❌ NEVER say Good Morning after 12 PM\n- ❌ NEVER say Good Night before 9 PM\n- If unsure → avoid greeting words, just say "Hey 👋 kya scene hai?"`

    const autoModeDetection = `\n\n🧩 AUTO MODE DETECTION:\n- Automatically detect user intent\n- Chill Mode (Hi/Hey/Bro): Short, friendly, no teaching\n- Question Mode ("What is..."): Direct answer, simple\n- Study Mode ("For exam", "Notes"): Structured, headings\n- Stress Mode ("Confused"): Calm, supportive\n- Command Mode ("Bana de"): Only output, clean`

    const behaviorRules = `\n\n🚫 STRICT RULES:\n- ❌ No over-explaining\n- ❌ No teacher tone unless Study Mode\n- ❌ No unnecessary follow-ups\n- Before replying: "Can this be shorter?" If yes → shorten`

    const systemPrompt = `You are MentraAI, a highly intelligent, human-like AI mentor for Indian students.
Tone: Calm mentor, simple Hinglish.
${nameInstruction}
${timeGreetingRules}
${autoModeDetection}
${behaviorRules}

🎯 TASK: Explain "${topic}" in 2 minutes (120-150 words max).

RULES:
- Explain ONLY the core idea
- Use simple Hinglish (Hindi+English mix)
- Max 120-150 words total
- Include 1 quick example (1 line)
- No theory dump
- No advanced math unless asked
- Time-focused, exam-revision friendly

OUTPUT FORMAT (JSON):
{
  "concept": "<core idea explanation in 2-3 sentences>",
  "example": "<one line example>",
  "takeaway": "<one bold key takeaway line>"
}

Important:
- Be concise and exam-oriented
- No over-explanation
- Focus on what matters for quick revision
- Always use correct time-based greeting`

    const parsed = await getStructuredChatCompletion(
      systemPrompt,
      [{ role: 'user', content: `Explain: ${topic}` }],
      language || 'hinglish'
    )

    return NextResponse.json({
      concept: parsed.concept,
      example: parsed.example,
      takeaway: parsed.takeaway,
      raw: JSON.stringify(parsed)
    })
  } catch (error: any) {
    console.error('2-Min Concept API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate 2-minute concept' },
      { status: 500 }
    )
  }
}
