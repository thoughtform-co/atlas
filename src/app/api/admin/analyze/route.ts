/**
 * Media Analysis API Route
 * 
 * Uses Gemini AI to analyze uploaded media and extract entity characteristics
 * for the Atlas bestiary.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isUserAdmin } from '@/lib/auth/admin-check';
import { analyzeImage, isGeminiConfigured, EntityAnalysisData } from '@/lib/ai/gemini';

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

    let result;

    // Use base64 for image analysis (more reliable for uploaded files)
    if (base64) {
      result = await analyzeImage({
        base64,
        mimeType,
      });
    } else {
      // For URL-based analysis, we'd need to fetch and convert to base64
      // This is a fallback for external URLs
      const response = await fetch(mediaUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      result = await analyzeImage({
        base64: base64Data,
        mimeType,
      });
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

