import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { estimateCost, type ReplicateWebhookPayload } from '@/lib/replicate';

// Use service role client for webhook (bypasses RLS)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role credentials not configured');
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * POST /api/forge/webhook
 * Handle Replicate prediction completion webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity (Replicate sends a specific header)
    // In production, you should verify the webhook signature
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const payload: ReplicateWebhookPayload = await request.json();
    
    console.log('[Forge Webhook] Received:', {
      id: payload.id,
      status: payload.status,
      hasOutput: !!payload.output,
      hasError: !!payload.error,
    });

    if (!payload.id) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Find the generation by replicate_prediction_id
    // @ts-ignore - forge_generations table not in generated types yet
    const { data: generation, error: findError } = await supabase
      .from('forge_generations')
      .select('id, session_id, duration')
      .eq('replicate_prediction_id', payload.id)
      .single();

    if (findError || !generation) {
      console.error('[Forge Webhook] Generation not found:', payload.id);
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      completed_at: payload.completed_at || new Date().toISOString(),
    };

    if (payload.status === 'succeeded') {
      // Extract video URL from output
      const videoUrl = Array.isArray(payload.output) 
        ? payload.output[0] 
        : payload.output;

      updateData.status = 'completed';
      updateData.video_url = videoUrl;
      
      // Generate thumbnail URL (Replicate often provides a poster frame)
      // For now, we'll use the video URL; could extract first frame later
      updateData.thumbnail_url = videoUrl;

      // Calculate and store cost
      const predictTime = payload.metrics?.predict_time;
      const costCents = estimateCost(generation.duration, predictTime);
      updateData.cost_cents = costCents;

      // Get session to find user_id for cost tracking
      // @ts-ignore - forge_sessions table not in generated types yet
      const { data: session } = await supabase
        .from('forge_sessions')
        .select('user_id')
        .eq('id', generation.session_id)
        .single();

      if (session?.user_id) {
        // Record cost
        // @ts-ignore - forge_costs table not in generated types yet
        await supabase
          .from('forge_costs')
          // @ts-ignore - forge_costs table not in generated types yet
          .insert({
            user_id: session.user_id,
            generation_id: generation.id,
            amount_cents: costCents,
            model: 'wan-2.5-i2v',
          });
      }

      console.log('[Forge Webhook] Generation completed:', {
        generationId: generation.id,
        videoUrl,
        costCents,
      });

    } else if (payload.status === 'failed') {
      updateData.status = 'failed';
      updateData.error_message = payload.error || 'Unknown error';
      
      console.log('[Forge Webhook] Generation failed:', {
        generationId: generation.id,
        error: payload.error,
      });

    } else if (payload.status === 'canceled') {
      updateData.status = 'failed';
      updateData.error_message = 'Generation was canceled';
    }

    // Update the generation
    // @ts-ignore - forge_generations table not in generated types yet
    const { error: updateError } = await supabase
      .from('forge_generations')
      // @ts-ignore - forge_generations table not in generated types yet
      .update(updateData)
      .eq('id', generation.id);

    if (updateError) {
      console.error('[Forge Webhook] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update generation' }, { status: 500 });
    }

    // Update session's updated_at
    // @ts-ignore - forge_sessions table not in generated types yet
    await supabase
      .from('forge_sessions')
      // @ts-ignore - forge_sessions table not in generated types yet
      .update({ updated_at: new Date().toISOString() })
      .eq('id', generation.session_id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Forge Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
