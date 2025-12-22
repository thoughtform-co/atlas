import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { fetchDenizenById, updateDenizen, deleteDenizen } from '@/lib/data';
import { deleteDenizenMedia, fetchDenizenMedia } from '@/lib/media';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/denizens/[id]
 * Get a single denizen by ID with all relations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const denizen = await fetchDenizenById(id);

    if (!denizen) {
      return NextResponse.json(
        {
          success: false,
          error: 'Denizen not found',
        },
        { status: 404 }
      );
    }

    // Fetch media for this denizen
    const media = await fetchDenizenMedia(id);

    return NextResponse.json({
      success: true,
      data: {
        ...denizen,
        media,
      },
    });
  } catch (error) {
    console.error('Error fetching denizen:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch denizen',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/denizens/[id]
 * Update denizen fields (requires authentication)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if denizen exists
    const existingDenizen = await fetchDenizenById(id);
    if (!existingDenizen) {
      return NextResponse.json(
        {
          success: false,
          error: 'Denizen not found',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Update denizen
    const updatedDenizen = await updateDenizen(id, body);

    if (!updatedDenizen) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update denizen',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDenizen,
    });
  } catch (error) {
    console.error('Error updating denizen:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update denizen',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/denizens/[id]
 * Delete denizen and cascade media (requires authentication)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if denizen exists
    const existingDenizen = await fetchDenizenById(id);
    if (!existingDenizen) {
      return NextResponse.json(
        {
          success: false,
          error: 'Denizen not found',
        },
        { status: 404 }
      );
    }

    // Delete all associated media first
    const media = await fetchDenizenMedia(id);
    for (const item of media) {
      await deleteDenizenMedia(item.id);
    }

    // Delete denizen (connections will be cascade deleted by database)
    const success = await deleteDenizen(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete denizen',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
    });
  } catch (error) {
    console.error('Error deleting denizen:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete denizen',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
