import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/supabase-server';
import { fetchConnections } from '@/lib/data';
import type { Connection } from '@/lib/types';

/**
 * GET /api/admin/connections
 * List all connections
 */
export async function GET() {
  try {
    const connections = await fetchConnections();

    return NextResponse.json({
      success: true,
      data: {
        connections,
        total: connections.length,
      },
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch connections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/connections
 * Create a connection between two denizens (requires authentication)
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
    const requiredFields = ['from', 'to', 'strength', 'type'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate connection type
    const validTypes = ['semantic', 'historical', 'adversarial'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid connection type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate strength (0-1)
    if (body.strength < 0 || body.strength > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Strength must be between 0 and 1',
        },
        { status: 400 }
      );
    }

    // Create connection in database
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('connections')
      .insert({
        from_denizen_id: body.from,
        to_denizen_id: body.to,
        strength: body.strength,
        type: body.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connection:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create connection',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const connection: Connection = {
      from: data.from_denizen_id,
      to: data.to_denizen_id,
      strength: data.strength,
      type: data.type,
    };

    return NextResponse.json(
      {
        success: true,
        data: connection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
