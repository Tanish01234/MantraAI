import { SupabaseClient } from '@supabase/supabase-js'

export type ModuleType = 'chat' | 'notes' | 'career' | 'exam_planner' | 'confusion'

export interface HistoryItem {
  id: string
  user_id: string
  session_id: string
  module_type: ModuleType
  title: string | null
  content: any // JSONB content
  metadata: any // JSONB metadata
  created_at: string
  updated_at: string
}

export interface ChatSession {
  session_id: string
  title: string
  module_type: ModuleType
  created_at: string
  updated_at: string
  message_count: number
}

/**
 * Generate a short title from conversation content using AI
 */
export async function generateTitle(content: string, maxWords: number = 7): Promise<string> {
  try {
    const response = await fetch('/api/history/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, maxWords })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate title')
    }
    
    const data = await response.json()
    return data.title || 'Untitled Conversation'
  } catch (error) {
    console.error('Error generating title:', error)
    // Fallback: Use first few words of content
    const words = content.trim().split(/\s+/).slice(0, maxWords)
    return words.join(' ') + (content.split(/\s+/).length > maxWords ? '...' : '')
  }
}

/**
 * Save or update history item
 */
export async function saveHistory(
  supabase: SupabaseClient | null,
  userId: string,
  sessionId: string,
  moduleType: ModuleType,
  content: any,
  title?: string,
  metadata?: any
): Promise<HistoryItem | null> {
  if (!supabase || !userId) {
    console.warn('Supabase not configured or user not authenticated')
    return null
  }

  try {
    // Check if history item already exists for this session
    const { data: existing } = await supabase
      .from('user_history')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single()

    if (existing) {
      // Update existing history
      const { data, error } = await supabase
        .from('user_history')
        .update({
          content,
          title: title || existing.title,
          metadata: metadata || existing.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating history:', error)
        return null
      }
      return data
    } else {
      // Create new history item
      const { data, error } = await supabase
        .from('user_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          module_type: moduleType,
          content,
          title: title || null,
          metadata: metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating history:', error)
        return null
      }
      return data
    }
  } catch (error) {
    console.error('Error saving history:', error)
    return null
  }
}

/**
 * Get all chat sessions for a user (for sidebar)
 */
export async function getChatSessions(
  supabase: SupabaseClient | null,
  userId: string,
  moduleType: ModuleType = 'chat'
): Promise<ChatSession[]> {
  if (!supabase || !userId) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('user_history')
      .select('session_id, title, module_type, created_at, updated_at, content')
      .eq('user_id', userId)
      .eq('module_type', moduleType)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching chat sessions:', error)
      return []
    }

    // Group by session_id and count messages
    const sessions: ChatSession[] = (data || []).map(item => ({
      session_id: item.session_id,
      title: item.title || 'Untitled Chat',
      module_type: item.module_type as ModuleType,
      created_at: item.created_at,
      updated_at: item.updated_at,
      message_count: Array.isArray(item.content?.messages) ? item.content.messages.length : 0
    }))

    return sessions
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return []
  }
}

/**
 * Get history item by session ID
 */
export async function getHistoryBySession(
  supabase: SupabaseClient | null,
  userId: string,
  sessionId: string
): Promise<HistoryItem | null> {
  if (!supabase || !userId) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('user_history')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching history by session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching history by session:', error)
    return null
  }
}

/**
 * Get all history for a user (for profile page)
 */
export async function getAllHistory(
  supabase: SupabaseClient | null,
  userId: string,
  moduleType?: ModuleType,
  limit: number = 100
): Promise<HistoryItem[]> {
  if (!supabase || !userId) {
    return []
  }

  try {
    let query = supabase
      .from('user_history')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (moduleType) {
      query = query.eq('module_type', moduleType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching all history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all history:', error)
    return []
  }
}

/**
 * Delete a specific session (PERMANENT)
 */
export async function deleteSession(
  supabase: SupabaseClient | null,
  userId: string,
  sessionId: string
): Promise<boolean> {
  if (!supabase || !userId) {
    return false
  }

  try {
    const { error } = await supabase
      .from('user_history')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error deleting session:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting session:', error)
    return false
  }
}

/**
 * Delete all history for a module type (PERMANENT)
 */
export async function deleteAllHistoryByModule(
  supabase: SupabaseClient | null,
  userId: string,
  moduleType: ModuleType
): Promise<boolean> {
  if (!supabase || !userId) {
    return false
  }

  try {
    const { error } = await supabase
      .from('user_history')
      .delete()
      .eq('user_id', userId)
      .eq('module_type', moduleType)

    if (error) {
      console.error('Error deleting all history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting all history:', error)
    return false
  }
}

/**
 * Delete ALL user history (PERMANENT - use with caution)
 */
export async function deleteAllHistory(
  supabase: SupabaseClient | null,
  userId: string
): Promise<boolean> {
  if (!supabase || !userId) {
    return false
  }

  try {
    const { error } = await supabase
      .from('user_history')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting all history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting all history:', error)
    return false
  }
}

/**
 * Update history title
 */
export async function updateHistoryTitle(
  supabase: SupabaseClient | null,
  userId: string,
  sessionId: string,
  newTitle: string
): Promise<boolean> {
  if (!supabase || !userId) {
    return false
  }

  try {
    const { error } = await supabase
      .from('user_history')
      .update({ title: newTitle })
      .eq('user_id', userId)
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error updating title:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating title:', error)
    return false
  }
}

/**
 * Get or create session ID for current conversation
 */
export function getOrCreateHistorySessionId(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID()
  }

  // Try to get existing session ID from sessionStorage
  let sessionId = sessionStorage.getItem('history_session_id')
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('history_session_id', sessionId)
  }

  return sessionId
}

/**
 * Clear session ID (for new conversation)
 */
export function clearHistorySessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('history_session_id')
  }
}

/**
 * Set specific session ID (for loading old conversation)
 */
export function setHistorySessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('history_session_id', sessionId)
  }
}
