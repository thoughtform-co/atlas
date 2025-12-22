import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { createServerClient } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * GET /api/admin/entity-classes
 * Get all unique entity classes
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const client = await createServerClient();
    const { data, error } = await client
      .from('denizens')
      .select('entity_class')
      .not('entity_class', 'is', null);

    if (error) {
      console.error('[entity-classes] Error fetching classes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch entity classes' },
        { status: 500 }
      );
    }

    // Extract unique, non-null entity classes
    const classes = new Set<string>();
    (data || []).forEach((row: { entity_class: string | null }) => {
      if (row.entity_class && row.entity_class.trim()) {
        classes.add(row.entity_class.trim());
      }
    });

    const result = Array.from(classes).sort();
    return NextResponse.json({ classes: result });
  } catch (error) {
    console.error('[entity-classes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/entity-classes
 * Update an entity class name (renames it across all denizens)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { oldName, newName } = body;

    if (!oldName || !newName || oldName.trim() === '' || newName.trim() === '') {
      return NextResponse.json(
        { error: 'Both oldName and newName are required' },
        { status: 400 }
      );
    }

    if (oldName === newName) {
      return NextResponse.json(
        { error: 'Old and new names cannot be the same' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Use service role key for admin operations (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 503 }
      );
    }

    const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Update all denizens with the old class name to the new class name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
      .from('denizens')
      .update({ entity_class: newName.trim() })
      .eq('entity_class', oldName.trim())
      .select();

    if (error) {
      console.error('[entity-classes] Error updating class:', error);
      return NextResponse.json(
        { error: 'Failed to update entity class' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      message: `Updated ${data?.length || 0} entities from "${oldName}" to "${newName}"`,
    });
  } catch (error) {
    console.error('[entity-classes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
