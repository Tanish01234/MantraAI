'use client'

import { useState, useEffect } from 'react'
import UndoToast from '@/components/UndoToast'
import { useAutoSave, restoreDraft } from '@/hooks/useAutoSave'
import { useResetWithUndo } from '@/hooks/useResetWithUndo'

type ConversationState = 'initial' | 'asking' | 'explaining' | 'complete'
type ProgressStage = 'confusion' | 'clarity' | 'confidence'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type: 'question' | 'answer' | 'explanation'
}

export default function ConfusionClarityPage() {
  const [topic, setTopic] = useState('')
  const [conversationState, setConversationState] = useState<ConversationState>('initial')
  const [progressStage, setProgressStage] = useState<ProgressStage>('confusion')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')

  // Auto-save topic and current answer
  const [clearTopicDraft] = useAutoSave({
    key: 'confusion-topic-draft',
    value: topic,
    debounceMs: 2500,
    enabled: !!topic.trim() && conversationState === 'initial'
  })

  const [clearAnswerDraft] = useAutoSave({
    key: 'confusion-answer-draft',
    value: currentAnswer,
    debounceMs: 2500,
    enabled: !!currentAnswer.trim() && conversationState !== 'initial'
  })

  // Reset with undo
  const {
    reset: resetFlow,
    undo: undoReset,
    showUndo,
    dismissUndo
  } = useResetWithUndo({
    initialState: {
      topic: '',
      conversationState: 'initial' as ConversationState,
      progressStage: 'confusion' as ProgressStage,
      messages: [] as Message[],
      currentQuestion: '',
      currentAnswer: ''
    },
    onReset: (state) => {
      setTopic(state.topic)
      setConversationState(state.conversationState)
      setProgressStage(state.progressStage)
      setMessages(state.messages)
      setCurrentQuestion(state.currentQuestion)
      setCurrentAnswer(state.currentAnswer)
      setSessionId(null)
    }
  })

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setConversationState('asking')
    setProgressStage('confusion')
    setMessages([])

    try {
      const response = await fetch('/api/confusion-clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          topic: topic.trim()
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setSessionId(data.sessionId)
      setCurrentQuestion(data.question)
      setMessages([{
        role: 'assistant',
        content: data.question,
        type: 'question'
      }])
      // Clear topic draft after successful start
      clearTopicDraft()
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation')
      setConversationState('initial')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (!sessionId) return

    setLoading(true)
    setError('')
    setCurrentAnswer('')
    clearAnswerDraft()

    // Add user answer to messages
    const userMessage: Message = {
      role: 'user',
      content: answer,
      type: 'answer'
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/confusion-clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          sessionId,
          answer
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        type: data.isExplanation ? 'explanation' : 'question'
      }
      setMessages(prev => [...prev, aiMessage])

      if (data.isExplanation) {
        setConversationState('explaining')
        setProgressStage('clarity')
        setCurrentQuestion('')
      } else if (data.isComplete) {
        setConversationState('complete')
        setProgressStage('confidence')
        setCurrentQuestion('')
      } else {
        setCurrentQuestion(data.response)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process answer')
    } finally {
      setLoading(false)
    }
  }

  // Restore drafts on mount
  useEffect(() => {
    if (conversationState === 'initial') {
      const savedTopic = restoreDraft<string>('confusion-topic-draft')
      if (savedTopic && !topic) {
        setTopic(savedTopic)
      }
    } else {
      const savedAnswer = restoreDraft<string>('confusion-answer-draft')
      if (savedAnswer && !currentAnswer) {
        setCurrentAnswer(savedAnswer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationState])

  const handleReset = () => {
    resetFlow({
      topic: '',
      conversationState: 'initial',
      progressStage: 'confusion',
      messages: [],
      currentQuestion: '',
      currentAnswer: ''
    })
    clearTopicDraft()
    clearAnswerDraft()
    setSessionId(null)
    setError('')
  }

  const getProgressPercentage = () => {
    switch (progressStage) {
      case 'confusion': return 33
      case 'clarity': return 66
      case 'confidence': return 100
      default: return 0
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 pt-24 pb-12">
        <div className="mb-6 p-6 animate-fade-in rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Confusion-to-Clarity Mode</h1>
            {conversationState !== 'initial' && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] genz-card rounded-xl transition-all duration-200"
              >
                Restart Flow
              </button>
            )}
          </div>
          <p className="text-[var(--text-secondary)]">
            Tell me what topic confuses you, and I'll ask guided questions to pinpoint exactly where you're stuck!
          </p>
        </div>

        {/* Progress Indicator */}
        {conversationState !== 'initial' && (
          <div className="genz-card mb-6 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex-1 text-center ${progressStage === 'confusion' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}>
                <div className="text-sm mb-1">Step 1</div>
                <div className="text-lg">🔍 Confusion</div>
              </div>
              <div className="flex-1 h-1 mx-2 genz-card rounded">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className={`flex-1 text-center ${progressStage === 'clarity' ? 'text-[var(--accent-primary)] font-semibold' : progressStage === 'confidence' ? 'text-green-500 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                <div className="text-sm mb-1">Step 2</div>
                <div className="text-lg">💡 Clarity</div>
              </div>
              <div className="flex-1 h-1 mx-2 genz-card rounded">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded transition-all duration-500"
                  style={{ width: `${progressStage === 'confidence' ? '100%' : '0%'}` }}
                />
              </div>
              <div className={`flex-1 text-center ${progressStage === 'confidence' ? 'text-green-500 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                <div className="text-sm mb-1">Step 3</div>
                <div className="text-lg">✨ Confidence</div>
              </div>
            </div>
            <div className="text-center text-sm text-[var(--text-secondary)]">
              {progressStage === 'confusion' && 'Identifying your confusion...'}
              {progressStage === 'clarity' && 'Explaining step-by-step...'}
              {progressStage === 'confidence' && 'You\'ve got this!'}
            </div>
          </div>
        )}

        {/* Initial Form */}
        {conversationState === 'initial' && (
          <form onSubmit={handleStart} className="p-6 space-y-6 animate-slide-up rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                What topic or chapter is confusing you?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="w-full px-4 py-3 genz-input"
                placeholder="e.g., Photosynthesis, Quadratic Equations, Newton's Laws..."
              />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Don't worry if you can't explain what's confusing - I'll help you figure it out!
              </p>
            </div>

            {error && (
              <div className="genz-card border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : 'Start Confusion-to-Clarity Journey'}
            </button>
          </form>
        )}

        {/* Conversation Area */}
        {conversationState !== 'initial' && (
          <div className="space-y-4">
            {/* Messages */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto animate-slide-up rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${message.role === 'user'
                      ? 'chat-bubble-user'
                      : message.type === 'question'
                        ? 'genz-card border-2 border-[var(--accent-warm)] text-[var(--text-primary)]'
                        : 'chat-bubble-ai'
                      }`}
                  >
                    {message.type === 'question' && (
                      <div className="text-xs font-semibold mb-2 text-[var(--accent-warm)]">🤔 Question:</div>
                    )}
                    {message.type === 'explanation' && (
                      <div className="text-xs font-semibold mb-2 text-[var(--accent-primary)]">💡 Explanation:</div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="chat-bubble-ai p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Answer Buttons (when there's a question) */}
            {currentQuestion && !loading && conversationState === 'asking' && (
              <div className="genz-card p-6 animate-slide-up">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Quick Answer:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAnswer('Theory confusing hai')}
                      className="px-4 py-3 genz-card hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Theory confusing hai
                    </button>
                    <button
                      onClick={() => handleAnswer('Examples confusing hain')}
                      className="px-4 py-3 genz-card hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Examples confusing hain
                    </button>
                    <button
                      onClick={() => handleAnswer('Formula samajh nahi aa raha')}
                      className="px-4 py-3 genz-card hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Formula confusing hai
                    </button>
                    <button
                      onClick={() => handleAnswer('Application nahi samajh aa raha')}
                      className="px-4 py-3 genz-card hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Application confusing hai
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Or type your own answer:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && currentAnswer.trim()) {
                          handleAnswer(currentAnswer)
                        }
                      }}
                      className="flex-1 px-4 py-2 genz-input"
                      placeholder="Type your answer..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complete State */}
            {conversationState === 'complete' && (
              <div className="genz-card p-6 border-2 border-green-300 dark:border-green-700 text-center animate-scale-in">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Great Job!</h3>
                <p className="text-[var(--text-primary)] mb-4">
                  You've moved from confusion to clarity! Do you want to explore another topic?
                </p>
                <button
                  onClick={handleReset}
                  className="btn-primary"
                >
                  Start New Topic
                </button>
              </div>
            )}

            {error && (
              <div className="genz-card border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
          </div>
        )}
        {showUndo && (
          <UndoToast
            message="Flow reset. Undo?"
            onUndo={undoReset}
            onDismiss={dismissUndo}
            timeout={10000}
          />
        )}
      </div>
    </div>
  )
}
