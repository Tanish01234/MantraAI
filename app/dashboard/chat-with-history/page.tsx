'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import ConceptCard from '@/components/ConceptCard'
import WeaknessSummaryCard from '@/components/WeaknessSummaryCard'
import UndoToast from '@/components/UndoToast'
import VoiceButton from '@/components/VoiceButton'
import VoiceInput from '@/components/VoiceInput'
import ChatSidebar from '@/components/ChatSidebar'
import { useAutoSave, restoreDraft } from '@/hooks/useAutoSave'
import { useResetWithUndo } from '@/hooks/useResetWithUndo'
import { useUser } from '@/contexts/UserContext'
import { useLanguage } from '@/lib/language'
import {
    saveHistory,
    getHistoryBySession,
    generateTitle,
    getOrCreateHistorySessionId,
    clearHistorySessionId,
    setHistorySessionId,
    deleteAllHistoryByModule
} from '@/lib/utils/history'

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

export default function ChatPageWithHistory() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string>(getOrCreateHistorySessionId())
    const [currentTitle, setCurrentTitle] = useState<string>('New Chat')
    const [showSidebar, setShowSidebar] = useState(true)
    const { user, firstName } = useUser()
    const { selectedLanguage, setLanguage, handleVoiceInput: processVoice } = useLanguage()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [showResetMenu, setShowResetMenu] = useState(false)
    const hasGeneratedTitle = useRef(false)

    // Auto-save input draft
    const [clearDraft] = useAutoSave({
        key: 'chat-input-draft',
        value: input,
        debounceMs: 2500,
        enabled: !!input.trim()
    })

    // Reset with undo
    const {
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
            loadCurrentSession()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, currentSessionId])

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

    // Auto-generate title after first AI response
    useEffect(() => {
        if (messages.length >= 2 && !hasGeneratedTitle.current && user) {
            hasGeneratedTitle.current = true
            autoGenerateTitle()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])

    // Save to history after each message
    useEffect(() => {
        if (messages.length > 0 && user) {
            saveCurrentSession()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])

    const loadCurrentSession = async () => {
        if (!user || !supabase) return

        try {
            const historyItem = await getHistoryBySession(supabase, user.id, currentSessionId)

            if (historyItem && historyItem.content?.messages) {
                setMessages(historyItem.content.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                })))
                setCurrentTitle(historyItem.title || 'Untitled Chat')
                hasGeneratedTitle.current = !!historyItem.title
            } else {
                // New session
                setMessages([])
                setCurrentTitle('New Chat')
                hasGeneratedTitle.current = false
            }
        } catch (error) {
            console.error('Error loading session:', error)
        }
    }

    const saveCurrentSession = async () => {
        if (!user || !supabase || messages.length === 0) return

        try {
            await saveHistory(
                supabase,
                user.id,
                currentSessionId,
                'chat',
                { messages },
                currentTitle !== 'New Chat' ? currentTitle : undefined,
                { language: selectedLanguage }
            )
        } catch (error) {
            console.error('Error saving session:', error)
        }
    }

    const autoGenerateTitle = async () => {
        if (!user || !supabase || messages.length < 2) return

        try {
            // Get first user message for title generation
            const firstUserMessage = messages.find(m => m.role === 'user')
            if (!firstUserMessage) return

            const title = await generateTitle(firstUserMessage.content, 7)
            setCurrentTitle(title)

            // Update in database
            await saveHistory(
                supabase,
                user.id,
                currentSessionId,
                'chat',
                { messages },
                title,
                { language: selectedLanguage }
            )
        } catch (error) {
            console.error('Error generating title:', error)
        }
    }

    const handleNewChat = async () => {
        // Save current session to history first (if has messages)
        if (messages.length > 0) {
            await saveCurrentSession()
        }

        // CRITICAL: Clear the session ID from sessionStorage FIRST
        // This ensures reload will create a fresh session
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('history-session-id')
        }

        // Create a completely new session ID
        const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Store the new session ID
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('history-session-id', newSessionId)
        }

        // Update state with new session
        setCurrentSessionId(newSessionId)
        setMessages([])
        setInput('')
        setCurrentTitle('New Chat')
        hasGeneratedTitle.current = false
        clearDraft()
    }

    const handleSelectChat = async (sessionId: string, title: string) => {
        // Save current session before switching
        if (messages.length > 0) {
            await saveCurrentSession()
        }

        // Switch to selected session
        setHistorySessionId(sessionId)
        setCurrentSessionId(sessionId)
        setCurrentTitle(title)
        hasGeneratedTitle.current = true

        // Load the selected session
        await loadCurrentSession()
    }

    const analyzeIntent = async (text: string): Promise<'greeting' | 'study' | 'stress' | 'command'> => {
        const lowerText = text.toLowerCase()

        const greetingPatterns = ['hi', 'hello', 'hey', 'namaste', 'kaise ho', 'kya haal', 'sup', 'yo']
        if (greetingPatterns.some(pattern => lowerText.includes(pattern))) {
            return 'greeting'
        }

        const commandPatterns = ['explain in 2 minutes', 'analyze', 'bana de', 'fix kar', 'short me']
        if (commandPatterns.some(pattern => lowerText.includes(pattern))) {
            return 'command'
        }

        const stressPatterns = ['samajh nahi', 'confused', 'darr', 'tension', 'yaad nahi', 'marks kam']
        if (stressPatterns.some(pattern => lowerText.includes(pattern))) {
            return 'stress'
        }

        return 'study'
    }

    const handleVoiceTranscript = async (text: string) => {
        if (!text.trim()) return

        const voiceResult = processVoice(text)
        setInput(voiceResult.text)

        const intent = await analyzeIntent(text)
        if (intent === 'greeting' || intent === 'command') {
            setTimeout(() => {
                handleSend()
            }, 500)
        }
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

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            const parsed = parseAIResponse(data.response)
            const assistantMessage: Message = {
                role: 'assistant',
                content: parsed.content,
                timestamp: new Date(),
                confidence: parsed.confidence,
                askBackQuestion: parsed.askBackQuestion,
                type: 'normal'
            }

            setMessages(prev => [...prev, assistantMessage])
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

    const handleResetChat = async () => {
        if (!confirm('Clear this chat? It will be moved to history.')) {
            return
        }

        // Save current session to history before clearing
        if (messages.length > 0) {
            await saveCurrentSession()
        }

        // CRITICAL: Clear the session ID from sessionStorage FIRST
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('history-session-id')
        }

        // Create a completely new session ID
        const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Store the new session ID
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('history-session-id', newSessionId)
        }

        // Update state with new session
        setCurrentSessionId(newSessionId)

        // Reset UI state
        setMessages([])
        setInput('')
        setCurrentTitle('New Chat')
        hasGeneratedTitle.current = false
        clearDraft()
        setShowResetMenu(false)
    }

    const handleDeleteAllChats = async () => {
        if (!confirm('Delete ALL chats permanently? This cannot be undone.')) {
            return
        }

        if (user && supabase) {
            // Delete from database
            await deleteAllHistoryByModule(supabase, user.id, 'chat')
        }

        // Clear current session
        clearHistorySessionId()
        const newSessionId = getOrCreateHistorySessionId()
        setCurrentSessionId(newSessionId)

        // Reset UI
        setMessages([])
        setInput('')
        setCurrentTitle('New Chat')
        hasGeneratedTitle.current = false
        clearDraft()
        setShowResetMenu(false)
    }

    const handleResetInput = () => {
        setInput('')
        clearDraft()
        setShowResetMenu(false)
    }

    const handle2MinConcept = async () => {
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
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            {showSidebar && (
                <div className="w-64 flex-shrink-0 h-full">
                    <ChatSidebar
                        currentSessionId={currentSessionId}
                        onNewChat={handleNewChat}
                        onSelectChat={handleSelectChat}
                        moduleType="chat"
                    />
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 flex flex-col m-4 overflow-hidden rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
                    {/* Header */}
                    <div className="flex-shrink-0 border-b border-[var(--border-subtle)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className="p-2 rounded-lg hover:bg-[rgba(255,107,157,0.1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <h1 className="text-2xl font-bold text-white">{currentTitle}</h1>
                            </div>
                            <p className="text-sm text-white/80">Ask me anything about your studies or career!</p>
                        </div>

                        {/* Glass Interaction Bar */}
                        <div className="mt-4 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between gap-4 animate-fade-in">
                            {/* Language Selector */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLanguage('English')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedLanguage === 'English'
                                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLanguage('Hinglish')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedLanguage === 'Hinglish'
                                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    Hinglish
                                </button>
                                <button
                                    onClick={() => setLanguage('Gujarati')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${selectedLanguage === 'Gujarati'
                                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    Gujarati
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.location.href = '/dashboard/profile'}
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    History
                                </button>
                                <button
                                    onClick={handleNewChat}
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    New Chat
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowResetMenu(!showResetMenu)}
                                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                                    >
                                        Reset ▼
                                    </button>
                                    {showResetMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 z-50 animate-scale-in shadow-2xl">
                                            <button
                                                onClick={handleResetChat}
                                                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                Reset Chat (Save to History)
                                            </button>
                                            <button
                                                onClick={handleDeleteAllChats}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                Delete All Chats
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                                <p className="text-xl font-semibold mb-2 text-white">Hello! I'm your AI Mentor</p>
                                <p className="text-sm mb-6 text-white/80">Ask me questions like:</p>
                                <ul className="space-y-2 text-sm text-white/60 text-left max-w-md">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                                        <span>"Explain photosynthesis in simple terms"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                                        <span>"Help me prepare for my math exam"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                                        <span>"What career options do I have after 12th?"</span>
                                    </li>
                                </ul>
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
                                            className={`max-w-[80%] ${message.role === 'user'
                                                ? 'chat-bubble-user'
                                                : 'chat-bubble-ai'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                            {message.role === 'assistant' && message.confidence && (
                                                <div className="mt-3 text-xs">
                                                    <span className={`inline-block px-3 py-1 rounded-full font-semibold ${message.confidence === 'high'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : message.confidence === 'medium'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                        Confidence: {message.confidence === 'high' ? '✅ High' : message.confidence === 'medium' ? '⚠️ Medium' : '❗ Low'}
                                                    </span>
                                                </div>
                                            )}
                                            {message.role === 'assistant' && message.askBackQuestion && (
                                                <div className="mt-3 p-3 rounded-xl genz-card border border-[var(--border-subtle)]">
                                                    <div className="text-xs font-semibold text-[var(--accent-primary)] mb-1">Your Turn</div>
                                                    <p className="text-sm text-[var(--text-primary)] dark:text-white">{message.askBackQuestion}</p>
                                                </div>
                                            )}
                                            {message.role === 'assistant' && (
                                                <VoiceButton text={message.content} />
                                            )}
                                            <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-[var(--text-muted)]'
                                                }`}>
                                                {message.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="chat-bubble-ai">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Fixed at Bottom */}
                    <div className="flex-shrink-0 border-t border-[var(--border-subtle)] p-6">
                        <div className="flex gap-3 mb-4">
                            <button
                                type="button"
                                onClick={handle2MinConcept}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 backdrop-blur-md text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:border-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ⏱️ Explain in 2 Minutes
                            </button>
                            <button
                                type="button"
                                onClick={handleWeaknessAnalysis}
                                disabled={loading || messages.length === 0}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 backdrop-blur-md text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:border-[var(--accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🧠 Analyze My Weakness
                            </button>
                        </div>
                        <form onSubmit={handleSend} className="flex gap-3 items-center">
                            <div className="flex-1 relative">
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
                                    className="w-full px-6 py-4 pr-14 rounded-full border border-[var(--border-subtle)] bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white placeholder-white/50 focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all shadow-inner"
                                    disabled={loading}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <VoiceInput
                                        onTranscript={handleVoiceTranscript}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="btn-aurora px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-bold text-white rounded-full"
                            >
                                Send
                            </button>
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
