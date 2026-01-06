'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/contexts/UserContext'
import { getAllHistory, deleteSession, deleteAllHistoryByModule, type HistoryItem, type ModuleType } from '@/lib/utils/history'

export default function ProfileHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filterModule, setFilterModule] = useState<ModuleType | 'all'>('all')
    const [expandedItem, setExpandedItem] = useState<string | null>(null)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [selectAll, setSelectAll] = useState(false)
    const { user } = useUser()

    useEffect(() => {
        if (user) {
            loadHistory()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filterModule])

    const loadHistory = async () => {
        if (!user) return
        setLoading(true)
        try {
            const moduleType = filterModule === 'all' ? undefined : filterModule
            const items = await getAllHistory(supabase, user.id, moduleType)
            setHistory(items)
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteItem = async (sessionId: string) => {
        if (!confirm('Delete this item? This action cannot be undone.')) {
            return
        }

        if (!user) return

        const success = await deleteSession(supabase, user.id, sessionId)
        if (success) {
            setHistory(prev => prev.filter(item => item.session_id !== sessionId))
        } else {
            alert('Failed to delete item. Please try again.')
        }
    }

    const handleClearModule = async (moduleType: ModuleType) => {
        if (!confirm(`Delete ALL ${moduleType} history? This action cannot be undone.`)) {
            return
        }

        if (!user) return

        const success = await deleteAllHistoryByModule(supabase, user.id, moduleType)
        if (success) {
            setHistory(prev => prev.filter(item => item.module_type !== moduleType))
            setSelectedItems([])
            setSelectAll(false)
        } else {
            alert('Failed to clear history. Please try again.')
        }
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([])
            setSelectAll(false)
        } else {
            setSelectedItems(history.map(item => item.session_id))
            setSelectAll(true)
        }
    }

    const handleToggleSelect = (sessionId: string) => {
        setSelectedItems(prev => {
            if (prev.includes(sessionId)) {
                const newSelected = prev.filter(id => id !== sessionId)
                setSelectAll(newSelected.length === history.length && history.length > 0)
                return newSelected
            } else {
                const newSelected = [...prev, sessionId]
                setSelectAll(newSelected.length === history.length)
                return newSelected
            }
        })
    }

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return

        if (!confirm(`Delete ${selectedItems.length} selected item(s)? This action cannot be undone.`)) {
            return
        }

        if (!user) return

        // Delete all selected items
        const deletePromises = selectedItems.map(sessionId =>
            deleteSession(supabase, user.id, sessionId)
        )

        const results = await Promise.all(deletePromises)
        const allSuccess = results.every(result => result)

        if (allSuccess) {
            setHistory(prev => prev.filter(item => !selectedItems.includes(item.session_id)))
            setSelectedItems([])
            setSelectAll(false)
        } else {
            alert('Some items failed to delete. Please try again.')
        }
    }

    const handleResetAllHistory = async () => {
        if (!confirm('🔥 DELETE ALL HISTORY PERMANENTLY? This will remove all your interactions across all modules and CANNOT be undone!')) {
            return
        }

        // Double confirmation for safety
        if (!confirm('Are you absolutely sure? This is your last chance to cancel.')) {
            return
        }

        if (!user) return

        // Delete all history for all modules
        const modules: ModuleType[] = ['chat', 'notes', 'career', 'exam_planner', 'confusion']
        const deletePromises = modules.map(module =>
            deleteAllHistoryByModule(supabase, user.id, module)
        )

        const results = await Promise.all(deletePromises)
        const allSuccess = results.every(result => result)

        if (allSuccess) {
            setHistory([])
            setSelectedItems([])
            setSelectAll(false)
            alert('✅ All history has been permanently deleted.')
        } else {
            alert('Failed to delete all history. Please try again.')
        }
    }

    const getModuleBadge = (type: ModuleType) => {
        const badges = {
            chat: { icon: '💬', label: 'Chat', color: 'from-blue-500 to-purple-500' },
            notes: { icon: '📝', label: 'Notes', color: 'from-green-500 to-teal-500' },
            career: { icon: '🎯', label: 'Career', color: 'from-orange-500 to-red-500' },
            exam_planner: { icon: '📅', label: 'Exam', color: 'from-pink-500 to-rose-500' },
            confusion: { icon: '💡', label: 'Confusion', color: 'from-yellow-500 to-amber-500' }
        }
        return badges[type] || badges.chat
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const modules: Array<{ value: ModuleType | 'all', label: string, icon: string }> = [
        { value: 'all', label: 'All', icon: '📚' },
        { value: 'chat', label: 'Chat', icon: '💬' },
        { value: 'notes', label: 'Notes', icon: '📝' },
        { value: 'career', label: 'Career', icon: '🎯' },
        { value: 'exam_planner', label: 'Exam', icon: '📅' },
        { value: 'confusion', label: 'Confusion', icon: '💡' }
    ]

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="genz-card p-6 animate-fade-in">
                {/* Header */}
                <div className="border-b border-[var(--border-subtle)] pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Your History</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        All your interactions across MentraAI modules
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {modules.map((module) => (
                        <button
                            key={module.value}
                            onClick={() => setFilterModule(module.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filterModule === module.value
                                ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)]'
                                }`}
                        >
                            <span className="mr-2">{module.icon}</span>
                            {module.label}
                        </button>
                    ))}
                </div>

                {/* Bulk Action Controls */}
                {history.length > 0 && (
                    <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-white/20 bg-white/10 text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 cursor-pointer"
                            />
                            <span className="text-sm text-white/80">
                                {selectedItems.length > 0
                                    ? `${selectedItems.length} selected`
                                    : 'Select All'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedItems.length === 0}
                                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Selected
                            </button>
                            <button
                                onClick={handleResetAllHistory}
                                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-all duration-200 flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                🔥 Reset All History
                            </button>
                        </div>
                    </div>
                )}

                {/* Clear Module Button */}
                {filterModule !== 'all' && history.length > 0 && (
                    <div className="mb-4">
                        <button
                            onClick={() => handleClearModule(filterModule as ModuleType)}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                            Clear all {filterModule} history
                        </button>
                    </div>
                )}

                {/* History List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-3 h-3 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">No history yet</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Start using MentraAI to build your learning history
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => {
                            const badge = getModuleBadge(item.module_type)
                            const isExpanded = expandedItem === item.id
                            const isSelected = selectedItems.includes(item.session_id)

                            return (
                                <div
                                    key={item.id}
                                    className={`genz-card p-4 hover:shadow-lg transition-all duration-200 animate-slide-up ${isSelected ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0 pt-1">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleSelect(item.session_id)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/10 text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 cursor-pointer"
                                            />
                                        </div>

                                        {/* Module Badge */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl shadow-md`}>
                                            {badge.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                                                        {item.title || 'Untitled'}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                                        <span className={`px-2 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white font-medium`}>
                                                            {badge.label}
                                                        </span>
                                                        <span>{formatDate(item.created_at)}</span>
                                                        {item.created_at !== item.updated_at && (
                                                            <span className="text-[var(--accent-primary)]">• Updated {formatDate(item.updated_at)}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                                        className="p-2 rounded-lg hover:bg-[rgba(255,107,157,0.1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                                        title={isExpanded ? 'Collapse' : 'Expand'}
                                                    >
                                                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.session_id)}
                                                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Content Preview */}
                                            {isExpanded && (
                                                <div className="mt-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                                                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                                                        {JSON.stringify(item.content, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Stats */}
                {!loading && history.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                        <p className="text-sm text-[var(--text-muted)] text-center">
                            Showing {history.length} {history.length === 1 ? 'item' : 'items'}
                            {filterModule !== 'all' && ` in ${filterModule}`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
