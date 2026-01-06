'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import UndoToast from '@/components/UndoToast'
import { useAutoSave, restoreDraft } from '@/hooks/useAutoSave'
import { useResetWithUndo } from '@/hooks/useResetWithUndo'

export default function NotesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [showResetMenu, setShowResetMenu] = useState(false)

  // Auto-save textarea draft
  const [clearTextDraft] = useAutoSave({
    key: 'notes-text-draft',
    value: textContent,
    debounceMs: 2500,
    enabled: !!textContent.trim()
  })

  // Reset with undo
  const {
    reset: resetNotes,
    undo: undoReset,
    showUndo,
    dismissUndo
  } = useResetWithUndo({
    initialState: { textContent: '', file: null, explanation: '' },
    onReset: (state) => {
      setTextContent(state.textContent)
      setFile(state.file)
      setExplanation(state.explanation)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  })

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      })
    }
    // Restore draft on mount
    const saved = restoreDraft<string>('notes-text-draft')
    if (saved && !textContent) {
      setTextContent(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For MVP, we'll use a simple approach
    // In production, you'd use pdf-parse or similar
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        // Simple text extraction - for full PDF parsing, use pdf-parse library
        // For now, we'll handle text files and show a message for PDFs
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = new TextDecoder().decode(arrayBuffer)
          resolve(text)
        } else {
          resolve('PDF content extraction requires server-side processing. Please paste your notes as text for now.')
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleUpload = async () => {
    if (!file && !textContent.trim()) {
      setError('Please upload a file or enter text')
      return
    }

    setLoading(true)
    setError('')
    setExplanation('')

    try {
      let content = textContent

      if (file) {
        // Upload to Supabase Storage
        if (user && supabase) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('notes')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
          }
        }

        // Extract text
        content = await extractTextFromPDF(file)
      }

      if (!content.trim()) {
        throw new Error('No content to explain')
      }

      // Get AI explanation
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setExplanation(data.explanation)

      // Clear draft after successful upload
      clearTextDraft()

      // Save to memory
      if (user && supabase) {
        await supabase.from('user_memory').insert({
          user_id: user.id,
          role: 'assistant',
          content: `Explained notes: ${content.substring(0, 100)}...`,
          interaction_type: 'notes'
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process notes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Upload Notes</h1>
            <p className="text-[var(--text-secondary)]">
              Upload your PDF or text notes, and I'll explain them in simple Hinglish!
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowResetMenu(!showResetMenu)}
              className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] rounded-xl transition-all duration-200 border border-[var(--border-subtle)] shadow-sm flex items-center gap-2"
            >
              <span>Reset Options</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showResetMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-dropdown p-2 z-50 animate-scale-in rounded-xl shadow-xl">
                <button
                  onClick={() => {
                    resetNotes({ textContent: '', file: null, explanation })
                    clearTextDraft()
                    setShowResetMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
                >
                  Reset Pasted Notes
                </button>
                <button
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                    setShowResetMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
                >
                  Reset Uploaded File
                </button>
                <div className="h-px bg-[var(--border-subtle)] my-1"></div>
                <button
                  onClick={() => {
                    resetNotes({ textContent: '', file: null, explanation: '' })
                    clearTextDraft()
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                    setShowResetMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Reset All
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Left Column: File Upload */}
          <div className="glass-card p-6 rounded-3xl flex flex-col h-full animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
                📄
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Upload File</h2>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]/50 transition-all duration-300 group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="mb-2 text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-[var(--text-muted)]">PDF, TXT, DOC (MAX. 10MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-between border border-[var(--border-subtle)] animate-fade-in">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xl">📎</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Paste Notes */}
          <div className="glass-card p-6 rounded-3xl flex flex-col h-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xl">
                ✍️
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Paste Text</h2>
            </div>

            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="flex-1 w-full p-4 genz-input resize-none min-h-[200px] text-base leading-relaxed"
              placeholder="Or paste your study notes here directly..."
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 glass-panel border-red-500/30 bg-red-500/10 text-red-200 rounded-xl flex items-center gap-3 animate-shake">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || (!file && !textContent.trim())}
          className="w-full py-4 btn-aurora text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-12 group"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Notes...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
              ✨ Get Simple Explanation
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          )}
        </button>

        {explanation && (
          <div className="glass-card p-8 rounded-3xl animate-fade-in border border-[var(--accent-primary)]/30 shadow-glow">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">💡</span>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Explanation</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed text-lg opacity-90">{explanation}</p>
            </div>
          </div>
        )}

        {showUndo && (
          <UndoToast
            message="Notes reset. Undo?"
            onUndo={undoReset}
            onDismiss={dismissUndo}
            timeout={10000}
          />
        )}
      </div>
    </div>
  )
}
