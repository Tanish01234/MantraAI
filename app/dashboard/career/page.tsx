'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import UndoToast from '@/components/UndoToast'
import { useAutoSave, restoreDraft } from '@/hooks/useAutoSave'
import { useResetWithUndo } from '@/hooks/useResetWithUndo'

export default function CareerPage() {
  const [formData, setFormData] = useState({
    currentEducation: '',
    interests: '',
    strengths: '',
    goals: ''
  })
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [showResetMenu, setShowResetMenu] = useState(false)

  // Auto-save form data
  const [clearFormDraft] = useAutoSave({
    key: 'career-form-draft',
    value: formData,
    debounceMs: 2500,
    enabled: Object.values(formData).some(v => v.trim())
  })

  // Reset with undo
  const {
    reset: resetCareer,
    undo: undoReset,
    showUndo,
    dismissUndo
  } = useResetWithUndo({
    initialState: {
      currentEducation: '',
      interests: '',
      strengths: '',
      goals: ''
    },
    onReset: (state) => {
      setFormData(state)
    }
  })

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
        if (user) {
          loadUserGoal(user)
        }
      })
    }
    // Restore draft on mount (only if no user goal loaded)
    const saved = restoreDraft<typeof formData>('career-form-draft')
    if (saved && !formData.currentEducation && !formData.interests) {
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

  const loadUserGoal = async (currentUser: any) => {
    if (!currentUser || !supabase) return
    try {
      const { data } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('interaction_type', 'career_goal')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        try {
          const parsed = JSON.parse(data.content)
          setFormData(prev => ({
            ...prev,
            ...parsed,
            goals: parsed.goals || ''
          }))
        } catch {
          setFormData(prev => ({
            ...prev,
            goals: data.content || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error loading goal:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setRoadmap('')

    try {
      const response = await fetch('/api/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setRoadmap(data.roadmap)

      // Clear draft after successful submit
      clearFormDraft()

      // Save user goal
      if (user && supabase) {
        await supabase.from('user_memory').insert({
          user_id: user.id,
          role: 'user',
          content: JSON.stringify(formData),
          interaction_type: 'career_goal'
        })

        await supabase.from('user_memory').insert({
          user_id: user.id,
          role: 'assistant',
          content: data.roadmap,
          interaction_type: 'career_roadmap'
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate roadmap')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 pt-24 pb-12">
        <div className="p-6 mb-6 animate-fade-in rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Career Guidance</h1>
            <div className="relative">
              <button
                onClick={() => setShowResetMenu(!showResetMenu)}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] genz-card rounded-xl transition-all duration-200"
              >
                Reset ▼
              </button>
              {showResetMenu && (
                <div className="absolute right-0 mt-2 w-48 genz-card py-1 z-10 animate-scale-in">
                  <button
                    onClick={() => {
                      resetCareer({ ...formData, currentEducation: '' })
                      setShowResetMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)] rounded-lg transition-colors"
                  >
                    Reset Education
                  </button>
                  <button
                    onClick={() => {
                      resetCareer({ ...formData, interests: '' })
                      setShowResetMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)] rounded-lg transition-colors"
                  >
                    Reset Interests
                  </button>
                  <button
                    onClick={() => {
                      resetCareer({
                        currentEducation: '',
                        interests: '',
                        strengths: '',
                        goals: ''
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
            Tell me about yourself, and I'll create a personalized career roadmap for you!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-slide-up rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Current Education Level
            </label>
            <select
              value={formData.currentEducation}
              onChange={(e) => setFormData({ ...formData, currentEducation: e.target.value })}
              required
              className="w-full px-4 py-3 genz-input"
            >
              <option value="">Select your education level</option>
              <option value="10th">10th Standard</option>
              <option value="12th">12th Standard</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Your Interests
            </label>
            <textarea
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 genz-input"
              placeholder="e.g., I love coding, mathematics, problem-solving..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Your Strengths
            </label>
            <textarea
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 genz-input"
              placeholder="e.g., Good at logical thinking, creative writing, leadership..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Career Goals (Optional)
            </label>
            <textarea
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 genz-input"
              placeholder="e.g., I want to become a software engineer, work in AI..."
            />
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
            {loading ? 'Generating Roadmap...' : 'Get My Career Roadmap'}
          </button>
        </form>

        {roadmap && (
          <div className="mt-6 genz-card p-6 border-[var(--border-soft)] animate-slide-up">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Your Career Roadmap</h2>
            <div className="prose max-w-none">
              <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{roadmap}</p>
            </div>
          </div>
        )}
        {showUndo && (
          <UndoToast
            message="Form reset. Undo?"
            onUndo={undoReset}
            onDismiss={dismissUndo}
            timeout={10000}
          />
        )}
      </div>
    </div>
  )
}
