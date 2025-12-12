import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { updateDenizenMedia } from '@/lib/media';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PUT /api/admin/denizen-media/[id]
 * Update media name only (requires authentication)
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

    const { id } = await params;

    // Parse request body - only allow name updates
    const body = await request.json();
    
    if (body.name === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: name',
        },
        { status: 400 }
      );
    }

    // Update media name only
    const updatedMedia = await updateDenizenMedia(id, {
      name: body.name,
    });

    if (!updatedMedia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update media or media not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMedia,
    });
  } catch (error) {
    console.error('Error updating media name:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update media name',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
