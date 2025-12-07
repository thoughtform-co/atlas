import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { updateDenizenMedia, deleteDenizenMedia } from '@/lib/media';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PUT /api/admin/media/[id]
 * Update media metadata (caption, altText, isPrimary, displayOrder)
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

    // Parse request body
    const body = await request.json();

    // Build update object
    const updates: {
      isPrimary?: boolean;
      caption?: string;
      altText?: string;
      displayOrder?: number;
    } = {};

    if (body.isPrimary !== undefined) {
      updates.isPrimary = body.isPrimary;
    }
    if (body.caption !== undefined) {
      updates.caption = body.caption;
    }
    if (body.altText !== undefined) {
      updates.altText = body.altText;
    }
    if (body.displayOrder !== undefined) {
      updates.displayOrder = body.displayOrder;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update',
        },
        { status: 400 }
      );
    }

    // Update media
    const media = await updateDenizenMedia(id, updates);

    if (!media) {
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
      data: media,
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Delete media file and record
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

    const { id } = await params;

    // Delete media
    const success = await deleteDenizenMedia(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete media or media not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
