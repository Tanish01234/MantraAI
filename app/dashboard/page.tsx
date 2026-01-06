'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import ConceptCard from '@/components/ConceptCard'
import WeaknessSummaryCard from '@/components/WeaknessSummaryCard'
import UndoToast from '@/components/UndoToast'
import VoiceButton from '@/components/VoiceButton'
import VoiceInput from '@/components/VoiceInput'
import { useAutoSave, restoreDraft } from '@/hooks/useAutoSave'
import { useResetWithUndo } from '@/hooks/useResetWithUndo'
import { useUser } from '@/contexts/UserContext'
import { useLanguage } from '@/lib/language'
import { saveConversation, getOrCreateSessionId, clearSessionId } from '@/lib/utils/conversations'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: 'high' | 'medium' | 'low'
  askBackQuestion?: string
  type?: 'normal' | 'concept' | 'weakness'
  conceptData?: {
    concept: string
    example: string
    takeaway: string
    topic?: string
  }
  weaknessData?: {
    weakAreas: string[]
    whyWeak: string
    nextActions: string[]
    confidence: 'high' | 'medium' | 'low'
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, firstName } = useUser()
  const { selectedLanguage, setLanguage, handleVoiceInput: processVoice, prepareResponse } = useLanguage()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showResetMenu, setShowResetMenu] = useState(false)
  const sessionIdRef = useRef<string>(getOrCreateSessionId())

  // Auto-save input draft
  const [clearDraft] = useAutoSave({
    key: 'chat-input-draft',
    value: input,
    debounceMs: 2500,
    enabled: !!input.trim()
  })

  // Reset with undo
  const {
    state: resetState,
    setState: setResetState,
    reset: resetChat,
    undo: undoReset,
    showUndo,
    dismissUndo
  } = useResetWithUndo<{ input: string; messages: Message[] }>({
    initialState: { input: '', messages: [] },
    onReset: (state) => {
      setInput(state.input)
      setMessages(state.messages)
    }
  })

  useEffect(() => {
    if (user) {
      loadUserMemory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Restore draft on mount
  useEffect(() => {
    const saved = restoreDraft<string>('chat-input-draft')
    if (saved && !input) {
      setInput(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close reset menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showResetMenu && !(event.target as Element).closest('.relative')) {
        setShowResetMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showResetMenu])

  const loadUserMemory = async () => {
    if (!user || !supabase) return
    try {
      const { data } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data && data.length > 0) {
        // Load recent interactions
        const recentMessages = data
          .filter(m => m.interaction_type === 'chat')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at)
          }))
        if (recentMessages.length > 0) {
          setMessages(recentMessages.reverse())
        }
      }
    } catch (error) {
      console.error('Error loading memory:', error)
    }
  }

  const saveToMemory = async (role: 'user' | 'assistant', content: string) => {
    if (!user || !supabase) return
    try {
      await supabase.from('user_memory').insert({
        user_id: user.id,
        role,
        content,
        interaction_type: 'chat'
      })
    } catch (error) {
      console.error('Error saving to memory:', error)
    }
  }

  const analyzeIntent = async (text: string): Promise<'greeting' | 'study' | 'stress' | 'command'> => {
    // Simple intent classification based on keywords
    const lowerText = text.toLowerCase()

    // Greeting patterns
    const greetingPatterns = ['hi', 'hello', 'hey', 'namaste', 'kaise ho', 'kya haal', 'sup', 'yo']
    if (greetingPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'greeting'
    }

    // Command patterns
    const commandPatterns = ['explain in 2 minutes', 'analyze', 'bana de', 'fix kar', 'short me']
    if (commandPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'command'
    }

    // Stress patterns
    const stressPatterns = ['samajh nahi', 'confused', 'darr', 'tension', 'yaad nahi', 'marks kam']
    if (stressPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'stress'
    }

    // Default to study for questions
    return 'study'
  }

  const handleVoiceTranscript = async (text: string) => {
    if (!text.trim()) return

    // Process voice input with language detection
    const voiceResult = processVoice(text)

    // Set the input field with transcribed text
    setInput(voiceResult.text)

    // Analyze intent
    const intent = await analyzeIntent(text)

    // Auto-send for greetings and commands, allow editing for study/stress
    if (intent === 'greeting' || intent === 'command') {
      // Small delay to show the text was captured
      setTimeout(() => {
        handleSend()
      }, 500)
    }
    // For study/stress, user can edit before sending
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setLoading(true)

    // Save user message to conversations table
    if (user?.id && supabase) {
      await saveConversation(
        supabase,
        user.id,
        sessionIdRef.current,
        'user',
        userInput,
        'chat'
      )
    }

    await saveToMemory('user', userInput)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          language: selectedLanguage,
          firstName
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get response')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Initialize assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'normal'
      }
      setMessages(prev => [...prev, assistantMessage])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accumulatedContent = ''

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value, { stream: true })
        accumulatedContent += chunkValue

        // Update the last message with new content
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg.role === 'assistant' && lastMsg.type === 'normal') {
            lastMsg.content = accumulatedContent
          }
          return newMessages
        })
      }

      // Final parsing for confidence/askBack (if they are still part of the stream)
      // Note: Streaming might break the "Confidence:" regex if it comes at the end.
      // We'll parse the full content at the end.
      const parsed = parseAIResponse(accumulatedContent)

      setMessages(prev => {
        const newMessages = [...prev]
        const lastMsg = newMessages[newMessages.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = parsed.content
          lastMsg.confidence = parsed.confidence
          lastMsg.askBackQuestion = parsed.askBackQuestion
        }
        return newMessages
      })

      // Save AI response to conversations table
      if (user?.id && supabase) {
        await saveConversation(
          supabase,
          user.id,
          sessionIdRef.current,
          'ai',
          accumulatedContent,
          'chat'
        )
      }

      await saveToMemory('assistant', accumulatedContent)
      // Clear draft after successful send
      clearDraft()
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        type: 'normal'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleResetChat = () => {
    resetChat({ input: '', messages: [] })
    clearDraft()
    // Create new session ID for new conversation
    sessionIdRef.current = getOrCreateSessionId()
    clearSessionId()
    sessionIdRef.current = getOrCreateSessionId()
    setShowResetMenu(false)
  }

  const handleResetInput = () => {
    resetChat({ input: '', messages: [...messages] })
    clearDraft()
    setShowResetMenu(false)
  }

  const handleNewChat = () => {
    // Clear messages and input
    setMessages([])
    setInput('')
    clearDraft()

    // Create new session ID
    sessionIdRef.current = getOrCreateSessionId()
    clearSessionId()
    sessionIdRef.current = getOrCreateSessionId()
  }

  const handle2MinConcept = async () => {
    // Use current input, or last user message, or prompt user
    let topic = input.trim()
    if (!topic && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      topic = lastUserMessage?.content || 'current topic'
    }
    if (!topic) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Please type a topic or question first, then click "Explain in 2 Minutes"',
        timestamp: new Date(),
        type: 'normal'
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/chat/2min-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          language: selectedLanguage,
          firstName
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const conceptMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'concept',
        conceptData: {
          concept: data.concept,
          example: data.example,
          takeaway: data.takeaway,
          topic: topic
        }
      }

      setMessages(prev => [...prev, conceptMessage])
      await saveToMemory('assistant', `2-Min Concept: ${data.raw || JSON.stringify(data)}`)
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        type: 'normal'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleWeaknessAnalysis = async () => {
    if (loading || messages.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/chat/weakness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          language: selectedLanguage
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const weaknessMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'weakness',
        weaknessData: {
          weakAreas: data.weakAreas,
          whyWeak: data.whyWeak,
          nextActions: data.nextActions,
          confidence: data.confidence
        }
      }

      setMessages(prev => [...prev, weaknessMessage])
      await saveToMemory('assistant', `Weakness Analysis: ${data.raw || JSON.stringify(data)}`)
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        type: 'normal'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-28 pb-4 px-4">
      {/* Main Chat Card */}
      <div className="flex-1 flex flex-col overflow-hidden glass-card rounded-3xl relative border-t border-white/10 shadow-2xl">

        {/* Header */}
        <div className="border-b border-[var(--border-subtle)] p-4 bg-white/5 backdrop-blur-md z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-3xl">🤖</span> AI Chat Mentor
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Ask me anything about your studies or career!</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <button
                onClick={() => setLanguage('English')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedLanguage === 'English'
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('Hinglish')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedLanguage === 'Hinglish'
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => setLanguage('Gujarati')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedLanguage === 'Gujarati'
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
              >
                Gujarati
              </button>

              <div className="h-6 w-px bg-[var(--border-subtle)] mx-1"></div>

              <div className="relative">
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  title="New Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={handleResetChat}
                  className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  title="Delete Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowResetMenu(!showResetMenu)}
                  className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="More Options"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
                {showResetMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card p-2 z-50 animate-scale-in rounded-xl">
                    <button
                      onClick={handleResetInput}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors whitespace-nowrap"
                    >
                      Clear Input
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in pb-20">
              <div className="text-6xl mb-6 animate-float">👋</div>
              <h2 className="text-3xl font-bold mb-3 text-gradient-mantra">Hello! I'm your AI Mentor</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                I can help you understand complex topics, prepare for exams, or guide your career path.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                <button
                  onClick={() => setInput("Explain photosynthesis simply")}
                  className="p-4 rounded-xl glass-panel hover:bg-[var(--bg-elevated)] transition-all duration-300 text-left group border border-transparent hover:border-[var(--accent-primary)]"
                >
                  <span className="text-xl mb-2 block">🌿</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">Explain photosynthesis simply</span>
                </button>
                <button
                  onClick={() => setInput("Help me prepare for my math exam")}
                  className="p-4 rounded-xl glass-panel hover:bg-[var(--bg-elevated)] transition-all duration-300 text-left group border border-transparent hover:border-[var(--accent-secondary)]"
                >
                  <span className="text-xl mb-2 block">📐</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)]">Help me prepare for my exam</span>
                </button>
                <button
                  onClick={() => setInput("What career options after 12th?")}
                  className="p-4 rounded-xl glass-panel hover:bg-[var(--bg-elevated)] transition-all duration-300 text-left group border border-transparent hover:border-[var(--accent-tertiary)]"
                >
                  <span className="text-xl mb-2 block">🚀</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-tertiary)]">What career options after 12th?</span>
                </button>
                <button
                  onClick={() => setInput("How to manage exam stress?")}
                  className="p-4 rounded-xl glass-panel hover:bg-[var(--bg-elevated)] transition-all duration-300 text-left group border border-transparent hover:border-[var(--accent-primary)]"
                >
                  <span className="text-xl mb-2 block">🧘</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">How to manage exam stress?</span>
                </button>
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div key={idx} className="animate-slide-up">
              {message.type === 'concept' && message.conceptData ? (
                <ConceptCard
                  concept={message.conceptData.concept}
                  example={message.conceptData.example}
                  takeaway={message.conceptData.takeaway}
                  topic={message.conceptData.topic}
                />
              ) : message.type === 'weakness' && message.weaknessData ? (
                <WeaknessSummaryCard
                  weakAreas={message.weaknessData.weakAreas}
                  whyWeak={message.weaknessData.whyWeak}
                  nextActions={message.weaknessData.nextActions}
                  confidence={message.weaknessData.confidence}
                />
              ) : (
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] ${message.role === 'user'
                      ? 'chat-bubble-user'
                      : 'chat-bubble-ai'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold mt-1">
                          AI
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        {message.role === 'assistant' && message.confidence && (
                          <div className="mt-3 text-xs flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${message.confidence === 'high'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : message.confidence === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                              {message.confidence === 'high' ? '✅ High Confidence' : message.confidence === 'medium' ? '⚠️ Medium Confidence' : '❗ Low Confidence'}
                            </span>
                          </div>
                        )}
                        {message.role === 'assistant' && message.askBackQuestion && (
                          <div className="mt-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                            <div className="text-xs font-semibold text-[var(--accent-primary)] mb-1 flex items-center gap-1">
                              <span>🤔</span> Your Turn
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">{message.askBackQuestion}</p>
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <div className="mt-2">
                            <VoiceButton text={message.content} />
                          </div>
                        )}
                        <p className={`text-[10px] mt-1 text-right opacity-60`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-slide-up">
              <div className="chat-bubble-ai">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                    AI
                  </div>
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[var(--accent-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[var(--accent-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/5 backdrop-blur-md border-t border-[var(--border-subtle)]">
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={handle2MinConcept}
              disabled={loading}
              className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
            >
              <span>⚡</span> Explain in 2 Min
            </button>
            <button
              type="button"
              onClick={handleWeaknessAnalysis}
              disabled={loading || messages.length === 0}
              className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
            >
              <span>🧠</span> Analyze Weakness
            </button>
          </div>

          <form onSubmit={handleSend} className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type here... or just speak 🎤"
                className="w-full pl-4 pr-24 py-3.5 genz-input shadow-inner"
                disabled={loading}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={loading}
                />
                <button
                  type="submit"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {showUndo && (
        <UndoToast
          message="Chat reset. Undo?"
          onUndo={undoReset}
          onDismiss={dismissUndo}
          timeout={10000}
        />
      )}
    </div>
  )
}

function parseAIResponse(text: string): {
  content: string
  confidence?: 'high' | 'medium' | 'low'
  askBackQuestion?: string
} {
  const confidenceMatch = text.match(/Confidence:\s*(High|Medium|Low)/i)
  const askMatch = text.match(/Ask-Me-Back:\s*(.+)/i)
  const confidence = confidenceMatch
    ? confidenceMatch[1].toLowerCase() as 'high' | 'medium' | 'low'
    : undefined
  let content = text.replace(/Confidence:.*$/im, '')
  content = content.replace(/Ask-Me-Back:.*$/im, '')
  const askBackQuestion = askMatch ? askMatch[1].trim() : undefined
  return { content: content.trim(), confidence, askBackQuestion }
}
