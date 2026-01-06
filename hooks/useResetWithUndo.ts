import { useState, useCallback, useRef } from 'react'

interface UseResetWithUndoOptions<T> {
  initialState: T
  onReset?: (state: T) => void
}

/**
 * Hook for managing reset with undo functionality
 * Stores previous state before reset and allows undo
 */
export function useResetWithUndo<T>({
  initialState,
  onReset
}: UseResetWithUndoOptions<T>) {
  const [currentState, setCurrentState] = useState<T>(initialState)
  const [undoState, setUndoState] = useState<T | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  const reset = useCallback((newState?: T) => {
    // Store current state for undo
    setUndoState(currentState)
    setShowUndo(true)
    
    // Reset to new state or initial
    const resetState = newState !== undefined ? newState : initialState
    setCurrentState(resetState)
    
    if (onReset) {
      onReset(resetState)
    }
  }, [currentState, initialState, onReset])

  const undo = useCallback(() => {
    if (undoState !== null) {
      setCurrentState(undoState)
      setUndoState(null)
      setShowUndo(false)
    }
  }, [undoState])

  const dismissUndo = useCallback(() => {
    setShowUndo(false)
    setUndoState(null)
  }, [])

  return {
    state: currentState,
    setState: setCurrentState,
    reset,
    undo,
    showUndo,
    dismissUndo
  }
}
