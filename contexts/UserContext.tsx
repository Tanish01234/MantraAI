'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { extractNameFromEmail } from '@/lib/utils/nameExtractor'

interface UserContextType {
  user: any
  firstName: string
  lastName: string
  email: string
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [firstName, setFirstName] = useState('User')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  // Listen to auth state changes
  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user)
          setEmail(user.email || '')
          const name = extractNameFromEmail(user.email || '')
          setFirstName(name.firstName)
          setLastName(name.lastName)
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user)
          setEmail(session.user.email || '')
          const name = extractNameFromEmail(session.user.email || '')
          setFirstName(name.firstName)
          setLastName(name.lastName)
        } else {
          setUser(null)
          setEmail('')
          setFirstName('User')
          setLastName('')
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{
      user,
      firstName,
      lastName,
      email
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
