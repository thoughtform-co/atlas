import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/forge/sessions
 * List all sessions for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch sessions with generation count and latest thumbnail
    const { data: sessions, error } = await supabase
      .from('forge_sessions')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        forge_generations (
          id,
          thumbnail_url,
          video_url,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Transform to include generation count and latest thumbnail
    const transformedSessions = sessions?.map(session => {
      const generations = session.forge_generations || [];
      const completedGenerations = generations.filter((g: { status: string }) => g.status === 'completed');
      const latestGeneration = completedGenerations.sort(
        (a: { created_at: string }, b: { created_at: string }) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        id: session.id,
        name: session.name,
        created_at: session.created_at,
        updated_at: session.updated_at,
        generation_count: generations.length,
        completed_count: completedGenerations.length,
        thumbnail_url: latestGeneration?.thumbnail_url || latestGeneration?.video_url || null,
      };
    });

    return NextResponse.json({ sessions: transformedSessions });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/forge/sessions
 * Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
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

    // Create session
    const { data: session, error } = await supabase
      .from('forge_sessions')
      .insert({
        user_id: user.id,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Sessions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
