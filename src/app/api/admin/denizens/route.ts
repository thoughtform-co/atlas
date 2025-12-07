import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/supabase-server';
import { fetchDenizens, createDenizen } from '@/lib/data';
import type { Denizen } from '@/lib/types';

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
 * POST /api/admin/denizens
 * Create a new denizen (requires authentication)
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
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'id',
      'name',
      'type',
      'glyphs',
      'position',
      'coordinates',
      'allegiance',
      'threatLevel',
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

    // Prepare denizen data
    const denizenData: Omit<Denizen, 'connections'> = {
      id: body.id,
      name: body.name,
      subtitle: body.subtitle,
      type: body.type,
      image: body.image,
      thumbnail: body.thumbnail,
      videoUrl: body.videoUrl,
      glyphs: body.glyphs,
      position: body.position,
      coordinates: body.coordinates,
      allegiance: body.allegiance,
      threatLevel: body.threatLevel,
      domain: body.domain,
      description: body.description,
      lore: body.lore,
      features: body.features,
      firstObserved: body.firstObserved,
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
