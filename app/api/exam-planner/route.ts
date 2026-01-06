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

    const { examName, examDate, subjects, dailyHours } = await request.json()

    if (!examName || !examDate || !subjects || !dailyHours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate days until exam
    const examDateObj = new Date(examDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    examDateObj.setHours(0, 0, 0, 0)
    
    const daysUntilExam = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExam < 1) {
      return NextResponse.json({ error: 'Exam date must be in the future' }, { status: 400 })
    }

    const subjectsList = subjects.split(',').map((s: string) => s.trim()).filter(Boolean)

    const prompt = `Create a detailed day-wise study plan for an exam in simple Hinglish. Here are the details:

Exam Name: ${examName}
Exam Date: ${examDate}
Days Remaining: ${daysUntilExam} days
Subjects: ${subjectsList.join(', ')}
Daily Study Hours: ${dailyHours} hours

Please provide:
1. A day-wise study schedule (Day 1, Day 2, etc.) showing what to study each day
2. Priority-based subject order (which subjects need more attention)
3. Time allocation for each subject per day
4. Short motivational tips (2-3 tips) in simple Hinglish
5. Revision schedule in the last few days before exam
6. Break suggestions to avoid burnout

Make it:
- Practical and realistic (don't overload)
- In simple Hinglish (mix of Hindi and English)
- Encouraging and motivating
- Easy to follow day by day
- Include specific topics/chapters to cover each day if possible

Format the response clearly with day numbers and make it easy to read.`

    const messages = [
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    const plan = await getChatCompletion(messages, 'study')

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Exam Planner API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate study plan' },
      { status: 500 }
    )
  }
}
