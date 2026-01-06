'use client'

import { useState, useEffect } from 'react'
import UndoToast from '@/components/UndoToast'
import { useAutoSave, restoreDraft } from '@/hooks/useAutoSave'
import { useResetWithUndo } from '@/hooks/useResetWithUndo'

export default function ExamPlannerPage() {
  const [formData, setFormData] = useState({
    examName: '',
    examDate: '',
    subjects: '',
    dailyHours: '2'
  })
  const [loading, setLoading] = useState(false)
  const [studyPlan, setStudyPlan] = useState('')
  const [error, setError] = useState('')
  const [showResetMenu, setShowResetMenu] = useState(false)

  // Auto-save form data
  const [clearFormDraft] = useAutoSave({
    key: 'exam-planner-form-draft',
    value: formData,
    debounceMs: 2500,
    enabled: !!(formData.examName || formData.subjects || formData.examDate)
  })

  // Reset with undo
  const {
    reset: resetPlanner,
    undo: undoReset,
    showUndo,
    dismissUndo
  } = useResetWithUndo({
    initialState: {
      examName: '',
      examDate: '',
      subjects: '',
      dailyHours: '2'
    },
    onReset: (state) => {
      setFormData(state)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStudyPlan('')

    try {
      const response = await fetch('/api/exam-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setStudyPlan(data.plan)
      // Clear draft after successful submit
      clearFormDraft()
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan')
    } finally {
      setLoading(false)
    }
  }

  // Restore draft on mount
  useEffect(() => {
    const saved = restoreDraft<typeof formData>('exam-planner-form-draft')
    if (saved && !formData.examName && !formData.subjects) {
      setFormData(saved)
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 pt-24 pb-12">
        <div className="mb-6 p-6 animate-fade-in rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Exam Planner</h1>
            <div className="relative">
              <button
                onClick={() => setShowResetMenu(!showResetMenu)}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] genz-card rounded-xl transition-all duration-200"
              >
                Reset ▼
              </button>
              {showResetMenu && (
                <div className="absolute right-0 mt-1 w-48 genz-card py-1 z-10 animate-scale-in">
                  <button
                    onClick={() => {
                      resetPlanner({ ...formData, examName: '', examDate: '', subjects: '', dailyHours: '2' })
                      setShowResetMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)] rounded-lg transition-colors"
                  >
                    Reset Plan Only
                  </button>
                  <button
                    onClick={() => {
                      resetPlanner({
                        examName: '',
                        examDate: '',
                        subjects: '',
                        dailyHours: '2'
                      })
                      clearFormDraft()
                      setShowResetMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)] rounded-lg transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-[var(--text-secondary)]">
            Enter your exam details, and I'll create a personalized day-wise study plan for you!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-slide-up rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Exam Name
            </label>
            <input
              type="text"
              value={formData.examName}
              onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
              required
              className="w-full px-4 py-3 genz-input"
              placeholder="e.g., CBSE Class 12 Board Exam, JEE Mains, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Exam Date
            </label>
            <input
              type="date"
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 genz-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Subjects (comma-separated)
            </label>
            <textarea
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 genz-input"
              placeholder="e.g., Mathematics, Physics, Chemistry, English"
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Separate subjects with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Daily Study Hours
            </label>
            <select
              value={formData.dailyHours}
              onChange={(e) => setFormData({ ...formData, dailyHours: e.target.value })}
              required
              className="w-full px-4 py-3 genz-input"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="5">5 hours</option>
              <option value="6">6 hours</option>
              <option value="8">8 hours</option>
            </select>
          </div>

          {error && (
            <div className="genz-card border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating Study Plan...' : 'Generate Study Plan'}
          </button>
        </form>

        {studyPlan && (
          <div className="mt-6 genz-card p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Your Study Plan</h2>
            <div className="prose max-w-none">
              <div className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{studyPlan}</div>
            </div>
          </div>
        )}
        {showUndo && (
          <UndoToast
            message="Plan reset. Undo?"
            onUndo={undoReset}
            onDismiss={dismissUndo}
            timeout={10000}
          />
        )}
      </div>
    </div>
  )
}
