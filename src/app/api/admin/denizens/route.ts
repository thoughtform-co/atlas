import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { fetchDenizens, createDenizen } from '@/lib/data';
import type { Denizen, DenizenType, Allegiance, ThreatLevel, PhaseState } from '@/lib/types';

/**
 * Generate a URL-friendly ID from a name
 */
function generateEntityId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const timestamp = Date.now().toString(36);
  return `${slug}-${timestamp}`;
}

/**
 * GET /api/admin/denizens
 * List all denizens with their media
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const denizens = await fetchDenizens();

    // Optional pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDenizens = denizens.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        denizens: paginatedDenizens,
        total: denizens.length,
        page,
        limit,
        totalPages: Math.ceil(denizens.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching denizens:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch denizens',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Input format from frontend (snake_case, flat structure)
 */
interface CreateEntityInput {
  name: string;
  subtitle?: string | null;
  type: DenizenType;
  allegiance: Allegiance;
  threat_level: ThreatLevel;
  domain: string;
  description: string;
  lore?: string | null;
  features?: string[] | null;
  glyphs: string;
  image?: string | null;
  // Position fields (flat)
  position_x: number;
  position_y: number;
  // Coordinate fields (flat)
  coord_geometry: number;
  coord_alterity: number;
  coord_dynamics: number;
  // Metaphysical fields
  phase_state?: PhaseState;
  hallucination_index?: number;
  manifold_curvature?: number;
}

/**
 * POST /api/admin/denizens
 * Create a new denizen (requires authentication)
 * 
 * Accepts snake_case fields from frontend and transforms to Denizen type
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateEntityInput = await request.json();

    // Validate required fields (using snake_case names from frontend)
    const requiredFields: (keyof CreateEntityInput)[] = [
      'name',
      'type',
      'glyphs',
      'allegiance',
      'threat_level',
      'domain',
      'description',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Generate ID from name
    const entityId = generateEntityId(body.name);

    // Transform flat snake_case input to nested Denizen structure
    const denizenData: Omit<Denizen, 'connections'> = {
      id: entityId,
      name: body.name,
      subtitle: body.subtitle ?? undefined,
      type: body.type,
      image: body.image ?? undefined,
      glyphs: body.glyphs,
      position: {
        x: body.position_x ?? 500,
        y: body.position_y ?? 400,
      },
      coordinates: {
        geometry: body.coord_geometry ?? 0,
        alterity: body.coord_alterity ?? 0,
        dynamics: body.coord_dynamics ?? 0,
      },
      allegiance: body.allegiance,
      threatLevel: body.threat_level,
      domain: body.domain,
      description: body.description,
      lore: body.lore ?? undefined,
      features: body.features ?? undefined,
      // Add metaphysical properties if provided
      metaphysical: (body.phase_state || body.hallucination_index !== undefined || body.manifold_curvature !== undefined) ? {
        phaseState: body.phase_state,
        hallucinationIndex: body.hallucination_index,
        manifoldCurvature: body.manifold_curvature,
      } : undefined,
    };

    // Create denizen
    const denizen = await createDenizen(denizenData);

    if (!denizen) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create denizen',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: denizen,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating denizen:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create denizen',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
