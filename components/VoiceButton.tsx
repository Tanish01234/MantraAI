'use client'

import { useState, useEffect, useRef } from 'react'

interface VoiceButtonProps {
  text: string
  onStart?: () => void
  onEnd?: () => void
}

export default function VoiceButton({ text, onStart, onEnd }: VoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = () => {
    if (!text) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speed
    utterance.pitch = 1
    utterance.volume = 1

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      voice => voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Natural'))
    ) || voices.find(voice => voice.lang.includes('en'))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      onStart?.()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      onEnd?.()
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const pause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    if (isPlaying && utteranceRef.current) {
      stop()
      utteranceRef.current.rate = newSpeed
      window.speechSynthesis.speak(utteranceRef.current)
    }
  }

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  if (!text) return null

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => {
          if (isPlaying) {
            if (isPaused) {
              resume()
            } else {
              pause()
            }
          } else {
            speak()
          }
        }}
        className={`genz-card p-2 rounded-full transition-all duration-200 ${
          isPlaying ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-primary)]'
        }`}
        title={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
      >
        {isPlaying ? (isPaused ? '▶️' : '⏸️') : '🎙️'}
      </button>

      {isPlaying && (
        <>
          <button
            onClick={stop}
            className="genz-card p-2 rounded-full text-[var(--text-primary)] transition-all duration-200"
            title="Stop"
          >
            ⏹️
          </button>
          <div className="flex items-center gap-1 genz-card px-2 py-1 rounded-full">
            <button
              onClick={() => handleSpeedChange(0.75)}
              className={`text-xs px-2 py-0.5 rounded ${
                speed === 0.75 ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
              }`}
            >
              0.75x
            </button>
            <button
              onClick={() => handleSpeedChange(1)}
              className={`text-xs px-2 py-0.5 rounded ${
                speed === 1 ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => handleSpeedChange(1.25)}
              className={`text-xs px-2 py-0.5 rounded ${
                speed === 1.25 ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
              }`}
            >
              1.25x
            </button>
          </div>
        </>
      )}
    </div>
  )
}

