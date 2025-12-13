import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Domain } from '@/lib/types';

// GET - Fetch all domains
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/domains] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform snake_case to camelCase
    const domains: Domain[] = (data || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      name: d.name as string,
      srefCode: d.sref_code as string | null,
      description: d.description as string | null,
      colorR: d.color_r as number,
      colorG: d.color_g as number,
      colorB: d.color_b as number,
      colorHex: d.color_hex as string,
      createdAt: d.created_at as string,
      updatedAt: d.updated_at as string,
    }));

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('[GET /api/domains] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new domain
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    const { name, srefCode, description, colorR, colorG, colorB, colorHex } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
    }

    // Insert the new domain
    const { data, error } = await supabase
      .from('domains')
      .insert({
        name: name.trim(),
        sref_code: srefCode || null,
        description: description || null,
        color_r: colorR ?? 202,
        color_g: colorG ?? 165,
        color_b: colorB ?? 84,
        color_hex: colorHex || '#CAA554',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json({ error: 'A domain with this name already exists' }, { status: 409 });
      }
      console.error('[POST /api/domains] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform response
    const domain: Domain = {
      id: data.id,
      name: data.name,
      srefCode: data.sref_code,
      description: data.description,
      colorR: data.color_r,
      colorG: data.color_g,
      colorB: data.color_b,
      colorHex: data.color_hex,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/domains] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
