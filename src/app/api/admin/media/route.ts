import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { uploadDenizenMedia } from '@/lib/media';
import type { MediaType } from '@/lib/types';

/**
 * POST /api/admin/media
 * Upload media for a denizen (multipart form data)
 *
 * Form fields:
 * - file: File (required)
 * - denizenId: string (required)
 * - mediaType: 'image' | 'video' | 'thumbnail' (required)
 * - isPrimary: boolean (optional)
 * - caption: string (optional)
 * - altText: string (optional)
 * - displayOrder: number (optional)
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

    // Parse multipart form data
    const formData = await request.formData();

    // Get required fields
    const file = formData.get('file') as File | null;
    const denizenId = formData.get('denizenId') as string | null;
    const mediaType = formData.get('mediaType') as MediaType | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: file',
        },
        { status: 400 }
      );
    }

    if (!denizenId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: denizenId',
        },
        { status: 400 }
      );
    }

    if (!mediaType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: mediaType',
        },
        { status: 400 }
      );
    }

    // Validate media type
    const validMediaTypes: MediaType[] = ['image', 'video', 'thumbnail'];
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid media type. Must be one of: ${validMediaTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get optional fields
    const isPrimaryStr = formData.get('isPrimary') as string | null;
    const isPrimary = isPrimaryStr === 'true';
    const caption = formData.get('caption') as string | null;
    const altText = formData.get('altText') as string | null;
    const displayOrderStr = formData.get('displayOrder') as string | null;
    const displayOrder = displayOrderStr ? parseInt(displayOrderStr, 10) : undefined;

    // Upload media
    const media = await uploadDenizenMedia(denizenId, file, mediaType, {
      isPrimary,
      caption: caption || undefined,
      altText: altText || undefined,
      displayOrder,
    });

    if (!media) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload media',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: media,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
