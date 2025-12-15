import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Type for forge_generations table (not yet in generated types)
interface ForgeGeneration {
  id: string;
  session_id: string;
  approved: boolean;
}

// Type for forge_sessions table
interface ForgeSession {
  id: string;
  user_id: string;
}

/**
 * POST /api/forge/approve
 * Toggle approval status for a generation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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
    // @ts-expect-error - forge_generations table not in generated types yet
    const { data: generation, error: findError } = await supabase
      .from('forge_generations')
      .select('id, session_id')
      .eq('id', generation_id)
      .single() as { data: ForgeGeneration | null; error: unknown };

    if (findError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Verify session ownership
    // @ts-expect-error - forge_sessions table not in generated types yet
    const { data: session, error: sessionError } = await supabase
      .from('forge_sessions')
      .select('user_id')
      .eq('id', generation.session_id)
      .single() as { data: ForgeSession | null; error: unknown };

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update approval status
    // @ts-expect-error - forge_generations table not in generated types yet
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
