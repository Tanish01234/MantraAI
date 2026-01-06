'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { getInitialsFromEmail } from '@/lib/utils/nameExtractor'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')

  // Load user from Supabase
  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
        setEmail(user?.email || '')
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        setEmail(session?.user?.email || '')
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      // Add blur to main content when dropdown is open
      const mainContent = document.querySelector('main')
      if (mainContent) {
        mainContent.classList.add('page-blur')
      }
    } else {
      // Remove blur when dropdown closes
      const mainContent = document.querySelector('main')
      if (mainContent) {
        mainContent.classList.remove('page-blur')
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      const mainContent = document.querySelector('main')
      if (mainContent) {
        mainContent.classList.remove('page-blur')
      }
    }
  }, [open])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    // Clear all client state
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    router.push('/auth/login')
    router.refresh()
  }

  const initials = user?.email ? getInitialsFromEmail(user.email) : 'U'

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl px-4">
      <div className="glass-panel rounded-full px-6 py-3 shadow-lg flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-xl font-bold text-gradient-mantra hover:scale-105 transition-transform duration-300">
            MantraAI
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`nav-pill-modern ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            Chat
          </Link>
          <Link
            href="/dashboard/notes"
            className={`nav-pill-modern ${pathname === '/dashboard/notes' ? 'active' : ''}`}
          >
            Notes
          </Link>
          <Link
            href="/dashboard/career"
            className={`nav-pill-modern ${pathname === '/dashboard/career' ? 'active' : ''}`}
          >
            Career
          </Link>
          <Link
            href="/dashboard/exam-planner"
            className={`nav-pill-modern ${pathname === '/dashboard/exam-planner' ? 'active' : ''}`}
          >
            Exam Planner
          </Link>
          <Link
            href="/dashboard/confusion-clarity"
            className={`nav-pill-modern ${pathname === '/dashboard/confusion-clarity' ? 'active' : ''}`}
          >
            Confusion → Clarity
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-[var(--bg-elevated)] transition-all duration-200 border border-transparent hover:border-[var(--border-subtle)]"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[var(--text-secondary)]">{initials}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-3 w-64 bg-black/90 backdrop-blur-xl border border-white/20 p-2 z-50 overflow-hidden animate-scale-in shadow-2xl rounded-2xl">
                  {/* User Info */}
                  <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white flex items-center justify-center font-semibold shadow-md">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/60">Signed in as</div>
                        <div className="text-sm font-medium text-white truncate">{email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <span className="text-base">👤</span>
                      <span>Profile & History</span>
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false)
                        alert('Privacy & Security settings coming soon!')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <span className="text-base">🔐</span>
                      <span>Privacy & Security</span>
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false)
                        window.open('/policy', '_blank')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <span className="text-base">📜</span>
                      <span>Policy</span>
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false)
                        alert('Help & Support coming soon!')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <span className="text-base">❓</span>
                      <span>Help & Support</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[var(--border-subtle)] pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <span className="text-base">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
