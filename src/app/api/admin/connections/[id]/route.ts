import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, requireAuth } from '@/lib/supabase-server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/admin/connections/[id]
 * Remove a connection (requires authentication)
 *
 * ID format: "fromId--toId" (double dash separator)
 * Example: /api/admin/connections/denizen1--denizen2
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

    // Parse connection ID (format: "from--to")
    const parts = id.split('--');
    if (parts.length !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid connection ID format. Expected: fromId--toId',
        },
        { status: 400 }
      );
    }

    const [fromId, toId] = parts;

    // Delete connection from database
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('connections')
      .delete()
      .eq('from_denizen_id', fromId)
      .eq('to_denizen_id', toId);

    if (error) {
      console.error('Error deleting connection:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete connection',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        from: fromId,
        to: toId,
        deleted: true,
      },
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
