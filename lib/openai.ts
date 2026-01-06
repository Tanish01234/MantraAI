import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { getSystemPrompt, type Language, type ModuleType } from './prompts/system'

const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim()

if (!apiKey) {
  console.warn('Gemini API key not configured')
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

const MODEL_NAME = 'gemini-flash-latest'

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

/**
 * Convert language string to Language type
 */
function normalizeLanguage(lang: string): Language {
  const lower = lang.toLowerCase()
  if (lower === 'english') return 'English'
  if (lower === 'gujarati') return 'Gujarati'
  return 'Hinglish' // default
}

/**
 * Convert mode string to ModuleType
 */
function normalizeModuleType(mode: string): ModuleType {
  const lower = mode.toLowerCase()
  if (lower === 'notes') return 'notes'
  if (lower === 'career') return 'career'
  if (lower === 'exam_planner' || lower === 'exam') return 'exam_planner'
  if (lower === 'confusion' || lower === 'confusion_clarity') return 'confusion'
  return 'chat' // default
}

/**
 * Get chat completion with production-grade MentraAI prompts (v3.0)
 */
export async function getChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  mode: 'study' | 'career' | 'notes' | 'exam' | 'confusion' = 'study',
  language: 'english' | 'hinglish' | 'gujarati' = 'hinglish',
  firstName?: string,
  moduleType?: ModuleType
) {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  const normalizedLanguage = normalizeLanguage(language)
  const normalizedModule = moduleType || normalizeModuleType(mode)
  const systemPrompt = getSystemPrompt(normalizedLanguage, firstName, normalizedModule)

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings })

    // Gemini doesn't have system messages in the same way, so we prepend to history or use systemInstruction (if supported by sdk version)
    // For compatibility, we'll prepend to the first user message or send as context
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System Instruction:\n${systemPrompt}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will follow these instructions.' }],
        },
        ...messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response
    return response.text()
  } catch (error: any) {
    console.error('Gemini Error:', error)
    throw new Error(error.message || 'Failed to get AI response')
  }
}

/**
 * Get custom chat completion with custom system prompt
 */
export async function getCustomChatCompletion(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  language: 'english' | 'hinglish' | 'gujarati' = 'hinglish'
) {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  const normalizedLanguage = normalizeLanguage(language)
  const languageInstruction = `\n\nSelected Language: ${normalizedLanguage}\nYou MUST respond ONLY in ${normalizedLanguage}. No mixing languages.`
  const fullSystemPrompt = `${systemPrompt}${languageInstruction}`

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings })

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System Instruction:\n${fullSystemPrompt}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood.' }],
        },
        ...messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    return result.response.text()
  } catch (error: any) {
    console.error('Gemini Error:', error)
    throw new Error(error.message || 'Failed to get AI response')
  }
}

/**
 * Generate AI response (simple wrapper)
 */
export async function generateAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings })

    // Simple generation for one-off prompts
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error: any) {
    console.error('Gemini Error:', error)
    throw new Error(error.message || 'Failed to get AI response')
  }
}

/**
 * Get structured chat completion using JSON mode
 */
export async function getStructuredChatCompletion(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  language: 'english' | 'hinglish' | 'gujarati' = 'hinglish'
) {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  const normalizedLanguage = normalizeLanguage(language)
  const languageInstruction = `\n\nSelected Language: ${normalizedLanguage}\nYou MUST respond ONLY in ${normalizedLanguage}. No mixing languages.`
  const fullSystemPrompt = `${systemPrompt}${languageInstruction}\n\nIMPORTANT: You must respond with a valid JSON object.`

  try {
    // Use gemini-1.5-flash for better JSON handling if available, otherwise pro
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings,
      generationConfig: {
        responseMimeType: "application/json"
      }
    })

    const prompt = `${fullSystemPrompt}\n\nUser Input:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.log('Raw content:', content)
      throw new Error('Failed to parse AI response as JSON')
    }
  } catch (error: any) {
    console.error('Gemini Error:', error)
    throw new Error(error.message || 'Failed to get AI response')
  }
}

/**
 * Get chat stream for use with 'ai' package
 */
export async function getChatStream(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  mode: 'study' | 'career' | 'notes' | 'exam' | 'confusion' = 'study',
  language: 'english' | 'hinglish' | 'gujarati' = 'hinglish',
  firstName?: string,
  moduleType?: ModuleType
) {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.')
  }

  const normalizedLanguage = normalizeLanguage(language)
  const normalizedModule = moduleType || normalizeModuleType(mode)
  const systemPrompt = getSystemPrompt(normalizedLanguage, firstName, normalizedModule)

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings })

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System Instruction:\n${systemPrompt}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I will follow these instructions.' }],
        },
        ...messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    return result
  } catch (error: any) {
    console.error('Gemini Error:', error)
    throw new Error(error.message || 'Failed to get AI response')
  }
}

export { genAI }
