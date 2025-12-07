/**
 * System Prompts API
 * 
 * CRUD operations for AI system prompts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest, isUserAdmin } from '@/lib/auth/admin-check';
import type { Database } from '@/lib/database.types';

// GET - List all prompts
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    const { data, error } = await (supabase as any)
      .from('system_prompts')
      .select('*')
      .order('name');

    if (error) {
      console.error('[prompts] Fetch error:', error);
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

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
        { error: error.message || 'Failed to create prompt' },
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

