import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/forge/sessions/[id]
 * Get a single session with all its generations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session with generations
    const { data: session, error } = await supabase
      .from('forge_sessions')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        forge_generations (
          id,
          denizen_id,
          source_image_url,
          video_url,
          thumbnail_url,
          prompt,
          negative_prompt,
          resolution,
          duration,
          seed,
          status,
          replicate_prediction_id,
          cost_cents,
          approved,
          error_message,
          created_at,
          completed_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      if (error && typeof error === 'object' && error !== null && 'code' in error && error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      console.error('Error fetching session:', error);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    // Sort generations by created_at descending
    if (session.forge_generations) {
      session.forge_generations.sort(
        (a: { created_at: string }, b: { created_at: string }) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/forge/sessions/[id]
 * Update session name
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
    }

    // Update session
    const { data: session, error } = await supabase
      .from('forge_sessions')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      console.error('Error updating session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/forge/sessions/[id]
 * Delete a session and all its generations
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete session (cascade will delete generations)
    const { error } = await supabase
      .from('forge_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting session:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
