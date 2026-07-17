/**
 * System Prompts API
 * 
 * CRUD operations for AI system prompts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { getUserFromRequest, isUserAdmin } from '@/lib/auth/admin-check';

// GET - List all prompts
export async function GET() {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('system_prompts')
      .select('*')
      .order('name');

    if (error) {
      console.error('[prompts] Fetch error:', error);
      // If table doesn't exist yet, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ prompts: [] });
      }
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompts: data || [] });
  } catch (error) {
    console.error('[prompts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new prompt
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, content, is_active = true } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('system_prompts')
      .insert({
        name,
        description,
        content,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('[prompts] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt: data }, { status: 201 });
  } catch (error) {
    console.error('[prompts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

