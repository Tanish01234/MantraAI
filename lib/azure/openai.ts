import { AzureOpenAI } from 'openai'

const endpoint = process.env.AZURE_OPENAI_ENDPOINT
const apiKey = process.env.AZURE_OPENAI_API_KEY
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'
const apiVersion = "2024-05-01-preview"

if (!endpoint || !apiKey) {
  console.warn('Azure OpenAI credentials not configured')
}

const client = endpoint && apiKey
  ? new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment: deploymentName,
  })
  : null

export async function getChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  mode: 'study' | 'career' = 'study'
) {
  const systemPrompt = mode === 'study'
    ? `You are MentraAI, a friendly AI mentor for Indian students. Your role is to:
- Explain concepts in simple Hinglish (mix of Hindi and English)
- Be encouraging and supportive like a real mentor
- Break down complex topics into easy steps
- Use examples relevant to Indian students
- Never give medical or legal advice
- Always explain step-by-step
- Keep responses conversational and warm

Remember: You're helping students understand difficult concepts, so be patient and clear.`
    : `You are MentraAI, a career guidance mentor for Indian students. Your role is to:
- Provide career guidance in simple Hinglish (mix of Hindi and English)
- Suggest realistic career paths based on student's background
- Create learning roadmaps with clear steps
- Be encouraging and supportive
- Focus on Indian job market and education system
- Never give medical or legal advice
- Provide actionable next steps

Remember: You're helping students plan their future, so be practical and motivating.`

  if (!client) {
    throw new Error('Azure OpenAI is not configured. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.')
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      model: deploymentName,
      temperature: 0.7,
      max_tokens: 1000,
    })

    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
  } catch (error: any) {
    console.error('Azure OpenAI Error:', error)
    throw new Error(error.message || 'Failed to get AI response')
  }
}

export { client }
