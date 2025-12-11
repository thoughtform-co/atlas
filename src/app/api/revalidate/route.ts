import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/revalidate
 * Revalidate a specific path to refresh server-rendered content
 * 
 * Body: { path: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Revalidate the specified path
    revalidatePath(path);

    return NextResponse.json({
      success: true,
      message: `Path ${path} revalidated`,
      revalidated: true,
      now: Date.now(),
    });
  } catch (error) {
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to revalidate path',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
