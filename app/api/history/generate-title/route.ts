import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
    try {
        const { content, maxWords = 7 } = await request.json()

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        // Create a prompt to generate a short title
        const prompt = `Generate a short, descriptive title (maximum ${maxWords} words) for the following conversation or content. The title should be clear, concise, and capture the main topic. Return ONLY the title, nothing else.

Content:
${content.substring(0, 500)}...`

        const title = await generateAIResponse([
            { role: 'system', content: 'You are a helpful assistant that generates short, descriptive titles for conversations. Return only the title, nothing else.' },
            { role: 'user', content: prompt }
        ])

        // Clean up the title (remove quotes, extra whitespace, etc.)
        const cleanTitle = title
            .replace(/^["']|["']$/g, '') // Remove quotes
            .replace(/^Title:\s*/i, '') // Remove "Title:" prefix
            .trim()
            .substring(0, 100) // Limit length

        return NextResponse.json({ title: cleanTitle })
    } catch (error: any) {
        console.error('Error generating title:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate title' },
            { status: 500 }
        )
    }
}
