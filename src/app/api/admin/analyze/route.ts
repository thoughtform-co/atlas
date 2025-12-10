/**
 * Media Analysis API Route
 * 
 * Uses Gemini AI to analyze uploaded media and extract entity characteristics
 * for the Atlas bestiary.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isUserAdmin } from '@/lib/auth/admin-check';
import { analyzeImage, analyzeVideo, isGeminiConfigured, buildWorldContext, EntityAnalysisData } from '@/lib/ai/gemini';
import { fetchDenizens } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { mediaUrl, mimeType, base64 } = body;

    // Validate input - either URL or base64 data
    if (!base64 && !mediaUrl) {
      return NextResponse.json(
        { error: 'Either mediaUrl or base64 data is required' },
        { status: 400 }
      );
    }

    if (!mimeType) {
      return NextResponse.json(
        { error: 'mimeType is required' },
        { status: 400 }
      );
    }

    // Fetch existing denizens for world-building context
    let worldContext = '';
    try {
      const existingDenizens = await fetchDenizens();
      if (existingDenizens && existingDenizens.length > 0) {
        worldContext = buildWorldContext(existingDenizens);
        console.log(`[analyze] Using world context from ${existingDenizens.length} existing denizens`);
      }
    } catch (error) {
      console.warn('[analyze] Failed to fetch world context, proceeding without it:', error);
      // Continue without context - not critical
    }

    const isVideo = mimeType.startsWith('video/');
    let result;

    // Use base64 for both image and video analysis
    if (base64) {
      if (isVideo) {
        result = await analyzeVideo({
          base64,
          mimeType,
        }, worldContext || undefined);
      } else {
        result = await analyzeImage({
          base64,
          mimeType,
        }, worldContext || undefined);
      }
    } else {
      // For URL-based analysis, fetch and convert to base64
      const response = await fetch(mediaUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      if (isVideo) {
        result = await analyzeVideo({
          base64: base64Data,
          mimeType,
        }, worldContext || undefined);
      } else {
        result = await analyzeImage({
          base64: base64Data,
          mimeType,
        }, worldContext || undefined);
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Analysis failed',
          rawText: result.rawText,
        },
        { status: 500 }
      );
    }

    // Transform the analysis data to match our entity form structure
    const entityData = transformAnalysisToFormData(result.data!);

    return NextResponse.json({
      success: true,
      analysis: result.data,
      formData: entityData,
      suggestions: result.data?.suggestions || undefined,
    });

  } catch (error) {
    console.error('[analyze] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Transform Gemini analysis to form field format
 */
function transformAnalysisToFormData(analysis: EntityAnalysisData) {
  return {
    name: analysis.name || '',
    subtitle: analysis.subtitle || '',
    type: analysis.type || 'Guardian',
    allegiance: analysis.allegiance || 'Unaligned',
    threatLevel: analysis.threatLevel || 'Cautious',
    domain: analysis.domain || '',
    description: analysis.description || '',
    lore: analysis.lore || '',
    features: analysis.features || [],
    phaseState: analysis.phaseState || 'Liminal',
    hallucinationIndex: analysis.hallucinationIndex ?? 0.5,
    manifoldCurvature: analysis.manifoldCurvature || 'Moderate',
    coordinates: {
      geometry: analysis.coordinates?.geometry ?? 0,
      alterity: analysis.coordinates?.alterity ?? 0,
      dynamics: analysis.coordinates?.dynamics ?? 0,
    },
    glyphs: analysis.glyphs || '◆●∇⊗',
    visualNotes: analysis.visualNotes || '',
  };
}

