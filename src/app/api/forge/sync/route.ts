import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getPrediction, estimateCost } from '@/lib/replicate';

/**
 * POST /api/forge/sync
 * Sync stuck generations by checking their status directly with Replicate
 * This is a fallback when webhooks don't fire
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional generation ID from body
    const body = await request.json().catch(() => ({}));
    const { generation_id } = body;

    // Build query for stuck generations
    let query = supabase
      .from('forge_generations')
      .select('id, replicate_prediction_id, session_id, duration, created_at')
      .in('status', ['pending', 'processing'])
      .not('replicate_prediction_id', 'is', null);

    // If specific generation ID provided, only sync that one
    if (generation_id) {
      query = query.eq('id', generation_id);
    } else {
      // Otherwise, get generations that have been processing for more than 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      query = query.lt('created_at', twoMinutesAgo);
    }

    // Get user's sessions first
    const { data: userSessions } = await supabase
      .from('forge_sessions')
      .select('id')
      .eq('user_id', user.id);

    if (!userSessions?.length) {
      return NextResponse.json({ synced: 0, message: 'No sessions found' });
    }

    const sessionIds = userSessions.map(s => s.id);
    query = query.in('session_id', sessionIds);

    const { data: stuckGenerations, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Forge Sync] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    if (!stuckGenerations?.length) {
      return NextResponse.json({ synced: 0, message: 'No stuck generations found' });
    }

    console.log(`[Forge Sync] Found ${stuckGenerations.length} stuck generations`);

    const results = [];

    for (const gen of stuckGenerations) {
      try {
        // Check status with Replicate
        const prediction = await getPrediction(gen.replicate_prediction_id!);
        
        console.log(`[Forge Sync] Prediction ${gen.replicate_prediction_id}:`, {
          status: prediction.status,
          hasOutput: !!prediction.output,
        });

        if (prediction.status === 'succeeded') {
          // Extract video URL
          const videoUrl = Array.isArray(prediction.output) 
            ? prediction.output[0] 
            : prediction.output;

          const costCents = estimateCost(gen.duration, prediction.metrics?.predict_time);

          await supabase
            .from('forge_generations')
            .update({
              status: 'completed',
              video_url: videoUrl,
              thumbnail_url: videoUrl,
              cost_cents: costCents,
              completed_at: prediction.completed_at || new Date().toISOString(),
            })
            .eq('id', gen.id);

          // Record cost
          const { data: session } = await supabase
            .from('forge_sessions')
            .select('user_id')
            .eq('id', gen.session_id)
            .single();

          if (session?.user_id) {
            await supabase
              .from('forge_costs')
              .insert({
                user_id: session.user_id,
                generation_id: gen.id,
                amount_cents: costCents,
                model: 'wan-2.5-i2v',
              });
          }

          results.push({ id: gen.id, status: 'completed', videoUrl });

        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
          await supabase
            .from('forge_generations')
            .update({
              status: 'failed',
              error_message: prediction.error || 'Generation failed or was canceled',
              completed_at: prediction.completed_at || new Date().toISOString(),
            })
            .eq('id', gen.id);

          results.push({ id: gen.id, status: 'failed', error: prediction.error });

        } else {
          // Still processing
          results.push({ id: gen.id, status: prediction.status });
        }

      } catch (err) {
        console.error(`[Forge Sync] Error checking generation ${gen.id}:`, err);
        results.push({ id: gen.id, status: 'error', error: String(err) });
      }
    }

    return NextResponse.json({
      synced: results.filter(r => r.status === 'completed' || r.status === 'failed').length,
      total: stuckGenerations.length,
      results,
    });

  } catch (error) {
    console.error('[Forge Sync] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
