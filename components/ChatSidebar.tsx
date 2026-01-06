'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/contexts/UserContext'
import { getChatSessions, deleteSession, type ChatSession } from '@/lib/utils/history'

interface ChatSidebarProps {
    currentSessionId: string
    onNewChat: () => void
    onSelectChat: (sessionId: string, title: string) => void
    moduleType?: 'chat' | 'notes' | 'career' | 'exam_planner' | 'confusion'
}

export default function ChatSidebar({
    currentSessionId,
    onNewChat,
    onSelectChat,
    moduleType = 'chat'
}: ChatSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredSession, setHoveredSession] = useState<string | null>(null)
    const { user } = useUser()

    useEffect(() => {
        if (user) {
            loadSessions()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, moduleType])

    const loadSessions = async () => {
        if (!user) return
        setLoading(true)
        try {
            const chatSessions = await getChatSessions(supabase, user.id, moduleType)
            setSessions(chatSessions)
        } catch (error) {
            console.error('Error loading sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()

        if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
            return
        }

        if (!user) return

        const success = await deleteSession(supabase, user.id, sessionId)
        if (success) {
            setSessions(prev => prev.filter(s => s.session_id !== sessionId))

            // If deleted session was current, start new chat
            if (sessionId === currentSessionId) {
                onNewChat()
            }
        } else {
            alert('Failed to delete chat. Please try again.')
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return 'Today'
        } else if (diffDays === 1) {
            return 'Yesterday'
        } else if (diffDays < 7) {
            return `${diffDays} days ago`
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7)
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
    }

    const getModuleIcon = (type: string) => {
        switch (type) {
            case 'chat': return '💬'
            case 'notes': return '📝'
            case 'career': return '🎯'
            case 'exam_planner': return '📅'
            case 'confusion': return '💡'
            default: return '💬'
        }
    }

    return (
        <div className="h-full flex flex-col border-r border-[var(--border-subtle)] backdrop-blur-xl bg-black/70">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <button
                    onClick={onNewChat}
                    className="w-full btn-aurora flex items-center justify-center gap-2 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <span className="text-lg">➕</span>
                    <span>New Chat</span>
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <p className="text-sm text-[var(--text-muted)]">No chats yet</p>
                        <p className="text-xs text-[var(--text-muted)] mt-2">Start a new conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.session_id}
                                className={`group relative rounded-xl p-3 cursor-pointer transition-all duration-200 ${session.session_id === currentSessionId
                                    ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                    : 'hover:bg-[rgba(255,107,157,0.1)] text-[var(--text-primary)]'
                                    }`}
                                onClick={() => onSelectChat(session.session_id, session.title)}
                                onMouseEnter={() => setHoveredSession(session.session_id)}
                                onMouseLeave={() => setHoveredSession(null)}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-lg flex-shrink-0 mt-0.5">
                                        {getModuleIcon(session.module_type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${session.session_id === currentSessionId ? 'text-white' : 'text-[var(--text-primary)]'
                                            }`}>
                                            {session.title}
                                        </p>
                                        <p className={`text-xs mt-1 ${session.session_id === currentSessionId ? 'text-white/80' : 'text-[var(--text-muted)]'
                                            }`}>
                                            {formatDate(session.updated_at)}
                                        </p>
                                    </div>
                                    {(hoveredSession === session.session_id || session.session_id === currentSessionId) && (
                                        <button
                                            onClick={(e) => handleDeleteSession(session.session_id, e)}
                                            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${session.session_id === currentSessionId
                                                ? 'hover:bg-white/20 text-white'
                                                : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
                                                }`}
                                            title="Delete chat"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)] text-center">
                    {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
                </p>
            </div>
        </div>
    )
}
