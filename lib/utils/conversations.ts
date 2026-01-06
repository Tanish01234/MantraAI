import { SupabaseClient } from '@supabase/supabase-js'

export interface ConversationMessage {
  role: 'user' | 'ai'
  message: string
  page_type: 'chat' | 'notes' | 'career' | 'exam' | 'confusion'
}

/**
 * Save a conversation message to Supabase
 */
export async function saveConversation(
  supabase: SupabaseClient | null,
  userId: string,
  sessionId: string,
  role: 'user' | 'ai',
  message: string,
  pageType: 'chat' | 'notes' | 'career' | 'exam' | 'confusion'
): Promise<void> {
  if (!supabase || !userId) {
    console.warn('Supabase not configured or user not authenticated')
    return
  }

  try {
    const { error } = await supabase.from('conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role,
      message,
      page_type: pageType
    })

    if (error) {
      console.error('Error saving conversation:', error)
    }
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}

/**
 * Get recent conversations for a user
 */
export async function getRecentConversations(
  supabase: SupabaseClient | null,
  userId: string,
  pageType?: 'chat' | 'notes' | 'career' | 'exam' | 'confusion',
  limit: number = 50
): Promise<ConversationMessage[]> {
  if (!supabase || !userId) {
    return []
  }

  try {
    let query = supabase
      .from('conversations')
      .select('role, message, page_type, session_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (pageType) {
      query = query.eq('page_type', pageType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    // Reverse to get chronological order
    return (data || []).reverse().map(item => ({
      role: item.role as 'user' | 'ai',
      message: item.message,
      page_type: item.page_type as 'chat' | 'notes' | 'career' | 'exam' | 'confusion'
    }))
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

/**
 * Generate or get existing session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID()
  }

  // Try to get existing session ID from sessionStorage
  let sessionId = sessionStorage.getItem('chat_session_id')
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('chat_session_id', sessionId)
  }

  return sessionId
}

/**
 * Clear session ID (for reset)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('chat_session_id')
  }
}
