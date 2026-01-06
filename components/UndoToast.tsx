'use client'

import { useEffect, useState } from 'react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  timeout?: number
}

export default function UndoToast({
  message,
  onUndo,
  onDismiss,
  timeout = 10000
}: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Wait for fade out
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout, onDismiss])

  const handleUndo = () => {
    setIsVisible(false)
    setTimeout(() => {
      onUndo()
      onDismiss()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-slide-up transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="genz-card p-4 min-w-[280px] max-w-md">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-primary)] flex-1">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-sm font-semibold text-[var(--accent-primary)] hover:bg-[rgba(255,107,157,0.1)] rounded-xl transition-all duration-200"
            >
              Undo
            </button>
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className="px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all duration-200"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
