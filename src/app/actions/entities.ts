'use server';

/**
 * Server Actions for Entity (Denizen) Operations
 * 
 * These actions can be used with forms via the `action` prop,
 * or called directly from client components.
 * 
 * Benefits over API routes:
 * - Type-safe from client to server
 * - Works with React 19's useActionState for form state
 * - Progressive enhancement (works without JS)
 * - Automatic revalidation integration
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient, requireAuth } from '@/lib/supabase-server';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { createDenizen, updateDenizen, deleteDenizen } from '@/lib/data';
import type { DenizenType, Allegiance, PhaseState } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface CreateEntityInput {
  name: string;
  subtitle?: string | null;
  type: DenizenType;
  entity_class?: string | null;
  allegiance: Allegiance;
  domain: string;
  description: string;
  features?: string[] | null;
  image?: string | null;
  thumbnail?: string | null;
  position_x: number;
  position_y: number;
  coord_geometry: number;
  coord_alterity: number;
  coord_dynamics: number;
  midjourney_prompt?: string | null;
  midjourney_sref?: string | null;
  midjourney_profile?: string | null;
  midjourney_stylization?: number | null;
  midjourney_style_weight?: number | null;
  phase_state?: PhaseState;
  hallucination_index?: number;
  manifold_curvature?: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a URL-friendly ID from a name
 */
function generateEntityId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const timestamp = Date.now().toString(36);
  return `${slug}-${timestamp}`;
}

/**
 * Verify user is authenticated and has admin role
 */
async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const user = await requireAuth();
  if (!user) {
    return { error: 'Unauthorized - please sign in' };
  }
  
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return { error: 'Admin access required' };
  }
  
  return { userId: user.id };
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new entity (denizen)
 * 
 * Can be used with forms:
 * <Form action={createEntity}>
 *   <input name="name" />
 *   ...
 * </Form>
 * 
 * Or called directly:
 * const result = await createEntity(formData);
 */
export async function createEntity(formData: FormData): Promise<ActionResult> {
  // Verify admin access
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  try {
    // Extract and validate required fields
    const name = formData.get('name') as string;
    const type = formData.get('type') as DenizenType;
    const allegiance = formData.get('allegiance') as Allegiance;
    const domain = formData.get('domain') as string;
    const description = formData.get('description') as string;

    if (!name || !type || !allegiance || !domain || !description) {
      return { 
        success: false, 
        error: 'Missing required fields: name, type, allegiance, domain, description' 
      };
    }

    // Generate ID
    const entityId = generateEntityId(name);

    // Build entity data
    const entityData = {
      id: entityId,
      name,
      subtitle: formData.get('subtitle') as string | undefined,
      type,
      entityClass: formData.get('entity_class') as string | undefined,
      allegiance,
      domain,
      description,
      features: formData.getAll('features') as string[] | undefined,
      image: formData.get('image') as string | undefined,
      thumbnail: formData.get('thumbnail') as string | undefined,
      glyphs: '◆●∇⊗',
      position: {
        x: parseFloat(formData.get('position_x') as string) || 0,
        y: parseFloat(formData.get('position_y') as string) || 0,
      },
      coordinates: {
        geometry: parseFloat(formData.get('coord_geometry') as string) || 0,
        alterity: parseFloat(formData.get('coord_alterity') as string) || 0,
        dynamics: parseFloat(formData.get('coord_dynamics') as string) || 0,
      },
      threatLevel: 'Cautious' as const,
      midjourneyPrompt: formData.get('midjourney_prompt') as string | undefined,
      midjourneySref: formData.get('midjourney_sref') as string | undefined,
      midjourneyProfile: formData.get('midjourney_profile') as string | undefined,
      midjourneyStylization: formData.get('midjourney_stylization') 
        ? parseFloat(formData.get('midjourney_stylization') as string) 
        : undefined,
      midjourneyStyleWeight: formData.get('midjourney_style_weight')
        ? parseFloat(formData.get('midjourney_style_weight') as string)
        : undefined,
      metaphysical: {
        phaseState: formData.get('phase_state') as PhaseState | undefined,
        hallucinationIndex: formData.get('hallucination_index')
          ? parseFloat(formData.get('hallucination_index') as string)
          : undefined,
        manifoldCurvature: formData.get('manifold_curvature')
          ? parseFloat(formData.get('manifold_curvature') as string)
          : undefined,
      },
    };

    // Create entity
    const denizen = await createDenizen(entityData);
    
    if (!denizen) {
      return { success: false, error: 'Failed to create entity in database' };
    }

    // Revalidate cached data using tags for efficient invalidation
    // Second arg is cache profile - { expire: 0 } for immediate invalidation
    revalidateTag('denizens', { expire: 0 });
    revalidatePath('/');
    revalidatePath('/archive');

    return { 
      success: true, 
      data: { id: denizen.id, name: denizen.name } 
    };
  } catch (error) {
    console.error('[createEntity] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update an existing entity
 */
export async function updateEntity(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // Verify admin access
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  try {
    // Build update data from form
    const updates: Record<string, unknown> = {};
    
    // Only include fields that are present in the form
    const name = formData.get('name');
    if (name) updates.name = name;
    
    const type = formData.get('type');
    if (type) updates.type = type;
    
    const allegiance = formData.get('allegiance');
    if (allegiance) updates.allegiance = allegiance;
    
    const domain = formData.get('domain');
    if (domain) updates.domain = domain;
    
    const description = formData.get('description');
    if (description) updates.description = description;
    
    // Position
    const posX = formData.get('position_x');
    const posY = formData.get('position_y');
    if (posX !== null && posY !== null) {
      updates.position = {
        x: parseFloat(posX as string),
        y: parseFloat(posY as string),
      };
    }
    
    // Coordinates
    const coordG = formData.get('coord_geometry');
    const coordA = formData.get('coord_alterity');
    const coordD = formData.get('coord_dynamics');
    if (coordG !== null && coordA !== null && coordD !== null) {
      updates.coordinates = {
        geometry: parseFloat(coordG as string),
        alterity: parseFloat(coordA as string),
        dynamics: parseFloat(coordD as string),
      };
    }

    const denizen = await updateDenizen(id, updates);
    
    if (!denizen) {
      return { success: false, error: 'Failed to update entity' };
    }

    // Revalidate cached data using tags for efficient invalidation
    revalidateTag('denizens', { expire: 0 });
    revalidateTag(`denizen-${id}`, { expire: 0 });
    revalidatePath('/');
    revalidatePath('/archive');
    revalidatePath(`/admin/edit/${id}`);

    return { success: true, data: { id: denizen.id } };
  } catch (error) {
    console.error('[updateEntity] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete an entity
 */
export async function deleteEntity(id: string): Promise<ActionResult> {
  // Verify admin access
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const success = await deleteDenizen(id);
    
    if (!success) {
      return { success: false, error: 'Failed to delete entity' };
    }

    // Revalidate cached data using tags for efficient invalidation
    revalidateTag('denizens', { expire: 0 });
    revalidatePath('/');
    revalidatePath('/archive');

    return { success: true };
  } catch (error) {
    console.error('[deleteEntity] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Approve/unapprove a forge generation
 * Used by ForgeVideoCard with useOptimistic
 */
export async function approveGeneration(
  generationId: string, 
  approved: boolean
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('forge_generations')
      .update({ approved })
      .eq('id', generationId);

    if (error) {
      console.error('[approveGeneration] Error:', error);
      return { success: false, error: error.message };
    }

    // Revalidate forge pages
    revalidatePath('/forge');

    return { success: true, data: { approved } };
  } catch (error) {
    console.error('[approveGeneration] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

