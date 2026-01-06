'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import ProfileHistory from '@/components/ProfileHistory'

export default function ProfilePage() {
    const { user, firstName } = useUser()
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile')

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="genz-card p-8 text-center">
                    <p className="text-[var(--text-muted)]">Please log in to view your profile</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 pt-24">
            <div className="p-6 animate-fade-in rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-black/70 backdrop-blur-xl">
                {/* Header */}
                <div className="border-b border-[var(--border-subtle)] pb-4 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                {firstName || 'User'}
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'profile'
                                ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)]'
                                }`}
                        >
                            👤 Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'history'
                                ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,107,157,0.1)]'
                                }`}
                        >
                            📜 History
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'profile' ? (
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-black/40">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Account Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-[var(--text-muted)]">Name</label>
                                    <p className="text-base text-[var(--text-primary)] font-medium">{firstName || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--text-muted)]">Email</label>
                                    <p className="text-base text-[var(--text-primary)] font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--text-muted)]">User ID</label>
                                    <p className="text-xs text-[var(--text-secondary)] font-mono">{user.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl border border-[var(--border-subtle)] bg-black/40">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Preferences</h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Customize your MentraAI experience (coming soon)
                            </p>
                        </div>
                    </div>
                ) : (
                    <ProfileHistory />
                )}
            </div>
        </div>
    )
}
