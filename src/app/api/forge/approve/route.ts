import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/forge/approve
 * Toggle approval status for a generation
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
    const { generation_id, approved } = body;

    if (!generation_id) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved status must be a boolean' }, { status: 400 });
    }

    // Verify generation belongs to user's session
    const { data: generation, error: findError } = await supabase
      .from('forge_generations')
      .select('id, forge_sessions!inner(user_id)')
      .eq('id', generation_id)
      .single();

    if (findError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Check ownership via the joined session
    const sessionData = generation.forge_sessions as { user_id: string };
    if (sessionData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update approval status
    const { data: updated, error: updateError } = await supabase
      .from('forge_generations')
      .update({ approved })
      .eq('id', generation_id)
      .select('id, approved')
      .single();

    if (updateError) {
      console.error('Error updating approval:', updateError);
      return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 });
    }

    return NextResponse.json({ generation: updated });

  } catch (error) {
    console.error('Approve POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
