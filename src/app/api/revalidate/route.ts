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
    const { path: reqPath } = await request.json();

    if (!reqPath || typeof reqPath !== 'string') {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Revalidate the specified path
    revalidatePath(reqPath);

    return NextResponse.json({
      success: true,
      message: `Path ${reqPath} revalidated`,
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
