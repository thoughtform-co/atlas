import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { generateVideo, validateGenerateParams, type GenerateVideoParams } from '@/lib/replicate';

// Types for forge tables (not yet in generated types)
interface ForgeGeneration {
  id: string;
  session_id: string;
  [key: string]: unknown;
}

interface ForgeSession {
  id: string;
  user_id: string;
}

/**
 * POST /api/forge/generate
 * Start a new video generation
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
    const { 
      session_id,
      denizen_id,
      image,
      prompt,
      negative_prompt,
      resolution = '720p',
      duration = 5,
      seed,
    } = body;

    // Validate session exists and belongs to user
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // @ts-ignore - forge_sessions table not in generated types yet
    const { data: session, error: sessionError } = await supabase
      .from('forge_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate generation parameters
    const params: GenerateVideoParams = {
      image,
      prompt,
      negative_prompt,
      resolution,
      duration,
      seed,
    };

    const validation = validateGenerateParams(params);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    // Create generation record in pending state
    // @ts-ignore - forge_generations table not in generated types yet
    const { data: generation, error: insertError } = await supabase
      .from('forge_generations')
      // @ts-ignore - forge_generations table not in generated types yet
      .insert({
        session_id,
        denizen_id: denizen_id || null,
        source_image_url: image,
        prompt,
        negative_prompt: negative_prompt || null,
        resolution,
        duration,
        seed: seed || null,
        status: 'pending',
      })
      .select()
      .single() as { data: ForgeGeneration | null; error: unknown };

    if (insertError || !generation) {
      console.error('Error creating generation:', insertError);
      return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 });
    }

    // Build webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/forge/webhook`;

    try {
      // Start Replicate prediction
      const prediction = await generateVideo(params, webhookUrl);

      // Update generation with prediction ID
      // @ts-ignore - forge_generations table not in generated types yet
      await supabase
        .from('forge_generations')
        // @ts-ignore - forge_generations table not in generated types yet
        .update({
          replicate_prediction_id: prediction.id,
          status: 'processing',
        })
        .eq('id', generation.id);

      // Update session's updated_at
      // @ts-ignore - forge_sessions table not in generated types yet
      await supabase
        .from('forge_sessions')
        // @ts-ignore - forge_sessions table not in generated types yet
        .update({ updated_at: new Date().toISOString() })
        .eq('id', session_id);

      return NextResponse.json({
        generation: {
          ...generation,
          replicate_prediction_id: prediction.id,
          status: 'processing',
        },
        prediction_id: prediction.id,
      }, { status: 201 });

    } catch (replicateError) {
      // Mark generation as failed
      // @ts-ignore - forge_generations table not in generated types yet
      await supabase
        .from('forge_generations')
        // @ts-ignore - forge_generations table not in generated types yet
        .update({
          status: 'failed',
          error_message: replicateError instanceof Error ? replicateError.message : 'Unknown error',
        })
        .eq('id', generation.id);

      console.error('Replicate API error:', replicateError);
      return NextResponse.json({ 
        error: 'Failed to start video generation',
        details: replicateError instanceof Error ? replicateError.message : 'Unknown error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Generate POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/forge/generate?id=<generation_id>
 * Poll for generation status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const generationId = request.nextUrl.searchParams.get('id');
    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    // Fetch generation
    // @ts-ignore - forge_generations table not in generated types yet
    const { data: generation, error } = await supabase
      .from('forge_generations')
      .select('*')
      .eq('id', generationId)
      .single() as { data: ForgeGeneration | null; error: unknown };

    if (error || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Verify user owns the session
    // @ts-ignore - forge_sessions table not in generated types yet
    const { data: session } = await supabase
      .from('forge_sessions')
      .select('user_id')
      .eq('id', generation.session_id)
      .single() as { data: ForgeSession | null; error: unknown };

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ generation });

  } catch (error) {
    console.error('Generate GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
