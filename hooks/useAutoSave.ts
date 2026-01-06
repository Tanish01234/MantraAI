import { useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveOptions {
  key: string
  value: any
  debounceMs?: number
  enabled?: boolean
}

/**
 * Auto-save hook that saves to localStorage with debouncing
 * Returns clear function to remove saved draft
 */
export function useAutoSave<T>({
  key,
  value,
  debounceMs = 2500,
  enabled = true
}: UseAutoSaveOptions): [() => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)

  // Save to localStorage
  const save = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return
    
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, value, enabled])

  // Debounced save
  useEffect(() => {
    if (!enabled || isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, debounceMs, save, enabled])

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error clearing draft:', error)
    }
  }, [key])

  return [clearDraft]
}

/**
 * Restore draft from localStorage
 */
export function restoreDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved) as T
    }
  } catch (error) {
    console.error('Error restoring from localStorage:', error)
  }
  return null
}
