import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * GET /api/history
 * Fetch user's history (all or filtered by module)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const moduleType = searchParams.get('module_type')
        const sessionId = searchParams.get('session_id')
        const limit = parseInt(searchParams.get('limit') || '100')

        // Build query
        let query = supabase
            .from('user_history')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(limit)

        if (moduleType) {
            query = query.eq('module_type', moduleType)
        }

        if (sessionId) {
            query = query.eq('session_id', sessionId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching history:', error)
            return NextResponse.json(
                { error: 'Failed to fetch history' },
                { status: 500 }
            )
        }

        return NextResponse.json({ history: data || [] })
    } catch (error: any) {
        console.error('Error in GET /api/history:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/history
 * Create or update history item
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { session_id, module_type, content, title, metadata } = body

        if (!session_id || !module_type || !content) {
            return NextResponse.json(
                { error: 'session_id, module_type, and content are required' },
                { status: 400 }
            )
        }

        // Check if history item already exists
        const { data: existing } = await supabase
            .from('user_history')
            .select('*')
            .eq('user_id', user.id)
            .eq('session_id', session_id)
            .single()

        if (existing) {
            // Update existing
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
                return NextResponse.json(
                    { error: 'Failed to update history' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ history: data, updated: true })
        } else {
            // Create new
            const { data, error } = await supabase
                .from('user_history')
                .insert({
                    user_id: user.id,
                    session_id,
                    module_type,
                    content,
                    title: title || null,
                    metadata: metadata || {}
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating history:', error)
                return NextResponse.json(
                    { error: 'Failed to create history' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ history: data, created: true })
        }
    } catch (error: any) {
        console.error('Error in POST /api/history:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/history
 * Delete history items
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('session_id')
        const moduleType = searchParams.get('module_type')
        const deleteAll = searchParams.get('delete_all') === 'true'

        if (deleteAll) {
            // Delete ALL user history
            const { error } = await supabase
                .from('user_history')
                .delete()
                .eq('user_id', user.id)

            if (error) {
                console.error('Error deleting all history:', error)
                return NextResponse.json(
                    { error: 'Failed to delete all history' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true, message: 'All history deleted' })
        } else if (sessionId) {
            // Delete specific session
            const { error } = await supabase
                .from('user_history')
                .delete()
                .eq('user_id', user.id)
                .eq('session_id', sessionId)

            if (error) {
                console.error('Error deleting session:', error)
                return NextResponse.json(
                    { error: 'Failed to delete session' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true, message: 'Session deleted' })
        } else if (moduleType) {
            // Delete all history for a module
            const { error } = await supabase
                .from('user_history')
                .delete()
                .eq('user_id', user.id)
                .eq('module_type', moduleType)

            if (error) {
                console.error('Error deleting module history:', error)
                return NextResponse.json(
                    { error: 'Failed to delete module history' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true, message: `${moduleType} history deleted` })
        } else {
            return NextResponse.json(
                { error: 'Either session_id, module_type, or delete_all must be specified' },
                { status: 400 }
            )
        }
    } catch (error: any) {
        console.error('Error in DELETE /api/history:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/history
 * Update history title or metadata
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { session_id, title, metadata } = body

        if (!session_id) {
            return NextResponse.json(
                { error: 'session_id is required' },
                { status: 400 }
            )
        }

        const updates: any = {}
        if (title !== undefined) updates.title = title
        if (metadata !== undefined) updates.metadata = metadata

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No updates provided' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('user_history')
            .update(updates)
            .eq('user_id', user.id)
            .eq('session_id', session_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating history:', error)
            return NextResponse.json(
                { error: 'Failed to update history' },
                { status: 500 }
            )
        }

        return NextResponse.json({ history: data, success: true })
    } catch (error: any) {
        console.error('Error in PATCH /api/history:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
