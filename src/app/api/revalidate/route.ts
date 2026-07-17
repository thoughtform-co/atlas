import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/supabase-server';
import { isUserAdmin } from '@/lib/auth/admin-check';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/revalidate
 * Revalidate a specific path to refresh server-rendered content.
 *
 * Admin-only: it is called from the admin edit page (a client component in
 * an authenticated admin session) after a save. Gating it on the cookie
 * session prevents an unauthenticated caller from using revalidatePath as a
 * free cache-busting lever.
 *
 * Body: { path: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
      { error: 'Failed to revalidate path' },
      { status: 500 }
    );
  }
}
