import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { Domain } from '@/lib/types';
import { requireAuth } from '@/lib/supabase-server';
import { isUserAdmin } from '@/lib/auth/admin-check';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/domains/[id]
 * Update a domain (name, description, etc.)
 * When domain name is updated, all denizens with that domain are also updated
 * Requires admin role.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id } = await params;
    const body = await request.json();

    const { name, srefCode, description, colorR, colorG, colorB, colorHex } = body;

    // Fetch the existing domain to get the old name
    const { data: existingDomain, error: fetchError } = await supabase
      .from('domains')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !existingDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const oldName = existingDomain.name;
    const newName = name?.trim();

    // If name is being updated, validate it
    if (newName !== undefined) {
      if (typeof newName !== 'string' || newName.length === 0) {
        return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
      }

      // Check if another domain with this name already exists
      const { data: existingWithName } = await supabase
        .from('domains')
        .select('id')
        .eq('name', newName)
        .neq('id', id)
        .single();

      if (existingWithName) {
        return NextResponse.json({ error: 'A domain with this name already exists' }, { status: 409 });
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (newName !== undefined) updateData.name = newName;
    if (srefCode !== undefined) updateData.sref_code = srefCode || null;
    if (description !== undefined) updateData.description = description || null;
    if (colorR !== undefined) updateData.color_r = colorR;
    if (colorG !== undefined) updateData.color_g = colorG;
    if (colorB !== undefined) updateData.color_b = colorB;
    if (colorHex !== undefined) updateData.color_hex = colorHex;

    // Update the domain
    const { data: updatedDomain, error: updateError } = await supabase
      .from('domains')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[PUT /api/domains/[id]] Error updating domain:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If domain name was changed, update all denizens with that domain
    if (newName && newName !== oldName) {
      const { error: denizensUpdateError } = await supabase
        .from('denizens')
        .update({ domain: newName })
        .eq('domain', oldName);

      if (denizensUpdateError) {
        console.error('[PUT /api/domains/[id]] Error updating denizens:', denizensUpdateError);
        // Don't fail the request, but log the error
        // The domain was updated successfully, denizens update can be retried
      }
    }

    // Transform response. Colors + timestamps are nullable in the DB row but
    // non-nullable on the Domain type; cast to match the GET handler's mapping.
    const domain: Domain = {
      id: updatedDomain.id,
      name: updatedDomain.name,
      srefCode: updatedDomain.sref_code,
      description: updatedDomain.description,
      colorR: updatedDomain.color_r as number,
      colorG: updatedDomain.color_g as number,
      colorB: updatedDomain.color_b as number,
      colorHex: updatedDomain.color_hex as string,
      createdAt: updatedDomain.created_at as string,
      updatedAt: updatedDomain.updated_at as string,
    };

    return NextResponse.json({ domain });
  } catch (error) {
    console.error('[PUT /api/domains/[id]] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
