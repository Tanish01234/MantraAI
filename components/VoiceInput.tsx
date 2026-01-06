'use client'

import { useState, useEffect, useRef } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onLanguageDetected?: (lang: 'english' | 'hinglish' | 'gujarati') => void
  disabled?: boolean
}

type ListeningState = 'idle' | 'listening' | 'processing' | 'done'

export default function VoiceInput({ onTranscript, onLanguageDetected, disabled }: VoiceInputProps) {
  const [state, setState] = useState<ListeningState>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef<string>('')

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US,hi-IN,gu-IN' // Support English, Hindi, Gujarati

    recognition.onstart = () => {
      setState('listening')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript || interimTranscript
      const cleanedTranscript = fullTranscript.trim()
      
      if (finalTranscript) {
        finalTranscriptRef.current = cleanedTranscript
      }
      
      setTranscript(cleanedTranscript)

      // Auto-stop after 3 seconds of silence (if final result)
      if (finalTranscript) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop()
          }
        }, 3000)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setState('idle')
    }

    recognition.onend = () => {
      const currentTranscript = finalTranscriptRef.current || transcript
      if (currentTranscript && currentTranscript.trim()) {
        processTranscript(currentTranscript)
        finalTranscriptRef.current = ''
      } else {
        setState('idle')
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [])

  const startListening = () => {
    if (disabled || !recognitionRef.current) return
    
    setTranscript('')
    finalTranscriptRef.current = ''
    setState('listening')
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      setState('idle')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop()
    }
  }

  const processTranscript = async (text: string) => {
    if (!text || !text.trim()) {
      setState('idle')
      return
    }

    setState('processing')

    // Clean text (remove fillers)
    const cleanedText = cleanTranscript(text)

    // Detect language
    const detectedLang = detectLanguage(cleanedText)
    onLanguageDetected?.(detectedLang)

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500))

    setState('done')
    onTranscript(cleanedText)

    // Reset after a moment
    setTimeout(() => {
      setState('idle')
      setTranscript('')
    }, 1000)
  }

  const cleanTranscript = (text: string): string => {
    // Remove common fillers
    const fillers = ['umm', 'uhh', 'aha', 'acha', 'yaar', 'bro', 'haa', 'hmm']
    let cleaned = text.toLowerCase()
    
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      cleaned = cleaned.replace(regex, '')
    })

    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    return cleaned
  }

  const detectLanguage = (text: string): 'english' | 'hinglish' | 'gujarati' => {
    // Simple language detection based on keywords
    const gujaratiKeywords = ['શું', 'કેવી', 'કેમ', 'આ', 'એ', 'હું']
    const hindiKeywords = ['क्या', 'कैसे', 'क्यों', 'मुझे', 'तुम', 'है', 'हैं', 'samajh', 'nahi', 'hai', 'kaise', 'kya']
    
    const hasGujarati = gujaratiKeywords.some(keyword => text.includes(keyword))
    const hasHindi = hindiKeywords.some(keyword => text.toLowerCase().includes(keyword))
    
    if (hasGujarati) return 'gujarati'
    if (hasHindi) return 'hinglish'
    return 'english'
  }

  const handleClick = () => {
    if (state === 'idle') {
      startListening()
    } else if (state === 'listening') {
      stopListening()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === 'processing'}
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-xl
          transition-all duration-300
          ${state === 'listening' 
            ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/50 animate-mic-pulse' 
            : state === 'processing'
            ? 'bg-[var(--accent-secondary)] text-white'
            : 'genz-card text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={state === 'listening' ? 'Listening... Speak now' : state === 'processing' ? 'Processing...' : 'Click to speak'}
      >
        {state === 'processing' ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          '🎤'
        )}
        
        {/* Pulse ring when listening */}
        {state === 'listening' && (
          <>
            <div className="absolute inset-0 rounded-xl bg-[var(--accent-primary)] animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-xl border-2 border-[var(--accent-secondary)] animate-pulse"></div>
          </>
        )}
      </button>

      {/* Tooltip */}
      {state === 'listening' && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-1 genz-card rounded-lg text-xs text-[var(--text-primary)] whitespace-nowrap animate-slide-up">
          Listening... Speak now
        </div>
      )}
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

