import { NextRequest, NextResponse } from 'next/server'
import { getChatCompletion } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, {
  topic: string
  questions: string[]
  answers: string[]
  confusionAreas: string[]
  stage: 'asking' | 'explaining'
}>()

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

    const { action, topic, sessionId, answer } = await request.json()

    if (action === 'start') {
      if (!topic || typeof topic !== 'string') {
        return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
      }

      // Generate session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Ask first diagnostic question
      const systemPrompt = `You are a patient, friendly AI mentor helping students identify their confusion. Your role is to ask ONE simple question at a time in Hinglish to understand where the student is stuck.

Rules:
- Ask only ONE question at a time
- Use simple Hinglish (mix of Hindi and English)
- Be calm and friendly
- Don't explain yet - just ask questions
- Focus on identifying the confusion area
- Questions should be binary or simple choices

Example questions:
- "Theory confusing hai ya examples?"
- "Formula samajh aa raha hai ya derivation?"
- "Concept clear hai ya application?"
- "Basics clear hain ya advanced part confusing hai?"

Topic: ${topic}

Ask the FIRST diagnostic question to understand where the student is confused.`

      const firstQuestion = await getChatCompletion([
        {
          role: 'user',
          content: `Student ne kaha: "${topic}" mujhe samajh nahi aa raha. Pehli question pucho confusion identify karne ke liye.`
        }
      ], 'study')

      // Store session
      sessions.set(newSessionId, {
        topic,
        questions: [firstQuestion],
        answers: [],
        confusionAreas: [],
        stage: 'asking'
      })

      return NextResponse.json({
        sessionId: newSessionId,
        question: firstQuestion
      })
    }

    if (action === 'answer') {
      if (!sessionId || !answer) {
        return NextResponse.json({ error: 'Session ID and answer are required' }, { status: 400 })
      }

      const session = sessions.get(sessionId)
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      session.answers.push(answer)

      // Determine if we need more questions or can start explaining
      const questionCount = session.questions.length
      const answerCount = session.answers.length

      // After 2-3 questions, start explaining
      if (questionCount >= 2 && answerCount >= 2) {
        // Generate explanation based on all answers
        const systemPrompt = `You are a patient AI mentor. Student ne "${session.topic}" ke baare mein confusion express kiya hai.

Student ke answers:
${session.answers.map((ans, i) => `${i + 1}. ${ans}`).join('\n')}

Ab tumhe:
1. Confusion area identify karni hai
2. Topic ko chhote parts mein break karna hai
3. Step-by-step simple Hinglish mein explain karna hai
4. Real-life examples dena hai
5. Encouraging aur friendly tone mein

Format:
- Pehle confusion area clearly batao
- Phir step-by-step explanation do
- Examples ke saath samjhao
- End mein confidence boost do

Keep it concise but complete.`

        const explanation = await getChatCompletion([
          {
            role: 'user',
            content: `Student ka topic: "${session.topic}"\n\nStudent ke confusion points:\n${session.answers.join('\n')}\n\nAb detailed explanation do step-by-step simple Hinglish mein.`
          }
        ], 'study')

        session.stage = 'explaining'
        sessions.set(sessionId, session)

        return NextResponse.json({
          response: explanation,
          isExplanation: true,
          isComplete: true
        })
      } else {
        // Ask next question
        const nextQuestionPrompt = `Student ne topic "${session.topic}" ke baare mein confusion express kiya.

Pehle ke questions aur answers:
${session.questions.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}
${session.answers.map((a, i) => `A${i + 1}: ${a}`).join('\n')}

Latest answer: ${answer}

Ab next diagnostic question pucho jo confusion area ko aur clearly identify kare. Ek hi question pucho, simple Hinglish mein.`

        const nextQuestion = await getChatCompletion([
          {
            role: 'user',
            content: nextQuestionPrompt
          }
        ], 'study')

        session.questions.push(nextQuestion)
        sessions.set(sessionId, session)

        return NextResponse.json({
          response: nextQuestion,
          isExplanation: false,
          isComplete: false
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Confusion Clarity API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
