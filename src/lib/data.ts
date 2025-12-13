import { supabase, isSupabaseConfigured } from './supabase';
import { createClient } from '@supabase/supabase-js';
import { Denizen, Connection, DenizenMedia, PhaseState } from './types';
import { denizens as staticDenizens, connections as staticConnections } from '@/data/denizens';
import type { Database } from './database.types';

/**
 * Get a Supabase client that works in both client and server contexts
 * Uses the browser client on client-side, creates a new client on server-side
 */
function getDataClient() {
  // On client-side, use the singleton browser client
  if (typeof window !== 'undefined' && supabase) {
    return supabase;
  }
  
  // On server-side, create a simple client (no auth needed for public reads)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Get an admin Supabase client for write operations
 * Uses the service role key which bypasses RLS
 * Only use this on the server-side for admin operations
 */
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[getAdminClient] Missing SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

// Type aliases for Supabase table operations
type DenizenInsert = Database['public']['Tables']['denizens']['Insert'];
type DenizenUpdate = Database['public']['Tables']['denizens']['Update'];

// Row types for Supabase responses
interface DenizenRow {
  id: string;
  name: string;
  subtitle: string | null;
  type: string;
  entity_class: string | null;
  entity_name: string | null;
  image: string | null;
  thumbnail: string | null;
  video_url: string | null;
  glyphs: string;
  position_x: number;
  position_y: number;
  coord_geometry: number;
  coord_alterity: number;
  coord_dynamics: number;
  allegiance: string;
  threat_level: string;
  domain: string;
  description: string;
  lore: string | null;
  features: string[] | null;
  first_observed: string | null;
  // MidJourney fields
  midjourney_prompt: string | null;
  midjourney_sref: string | null;
  midjourney_profile: string | null;
  midjourney_stylization: number | null;
  midjourney_style_weight: number | null;
  // Metaphysical fields
  phase_state: string | null;
  hallucination_index: number | null;
  manifold_curvature: number | null;
}

interface DenizenMediaRow {
  id: string;
  denizen_id: string;
  media_type: string;
  storage_path: string;
  file_name: string;
  name: string | null;
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  is_primary: boolean;
  caption: string | null;
  alt_text: string | null;
  created_at: string;
  updated_at: string;
}

interface ConnectionRow {
  from_denizen_id: string;
  to_denizen_id: string;
  strength: number;
  type: string;
}

interface ConnectionRefRow {
  from_denizen_id: string;
  to_denizen_id: string;
}

/**
 * Transform Supabase media row to DenizenMedia type
 */
function transformMediaRow(row: DenizenMediaRow): DenizenMedia {
  return {
    id: row.id,
    denizenId: row.denizen_id,
    mediaType: row.media_type as DenizenMedia['mediaType'],
    storagePath: row.storage_path,
    fileName: row.file_name,
    name: row.name ?? undefined,
    fileSize: row.file_size ?? undefined,
    mimeType: row.mime_type ?? undefined,
    displayOrder: row.display_order,
    isPrimary: row.is_primary,
    caption: row.caption ?? undefined,
    altText: row.alt_text ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform Supabase row to Denizen type
 */
function transformDenizenRow(row: DenizenRow, connectionIds: string[], media: DenizenMedia[] = []): Denizen {
  // Build metaphysical properties if any are present
  const hasMetaphysical = row.phase_state || row.hallucination_index !== null || row.manifold_curvature !== null;
  const metaphysical = hasMetaphysical ? {
    phaseState: (row.phase_state as PhaseState) ?? undefined,
    hallucinationIndex: row.hallucination_index ?? undefined,
    manifoldCurvature: row.manifold_curvature ?? undefined,
  } : undefined;

  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle ?? undefined,
    type: row.type as Denizen['type'],
    entityClass: row.entity_class ?? undefined,
    entityName: row.entity_name ?? undefined,
    image: row.image ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    videoUrl: row.video_url ?? undefined,
    glyphs: row.glyphs,
    position: { x: row.position_x, y: row.position_y },
    coordinates: {
      geometry: row.coord_geometry,
      alterity: row.coord_alterity,
      dynamics: row.coord_dynamics,
    },
    allegiance: row.allegiance as Denizen['allegiance'],
    threatLevel: row.threat_level as Denizen['threatLevel'],
    domain: row.domain,
    description: row.description,
    lore: row.lore ?? undefined,
    features: row.features ?? undefined,
    firstObserved: row.first_observed ?? undefined,
    midjourneyPrompt: row.midjourney_prompt ?? undefined,
    midjourneySref: row.midjourney_sref ?? undefined,
    midjourneyProfile: row.midjourney_profile ?? undefined,
    midjourneyStylization: row.midjourney_stylization ?? undefined,
    midjourneyStyleWeight: row.midjourney_style_weight ?? undefined,
    connections: connectionIds,
    media: media.length > 0 ? media : undefined,
    metaphysical,
  };
}

/**
 * Transform Supabase row to Connection type
 */
function transformConnectionRow(row: ConnectionRow): Connection {
  return {
    from: row.from_denizen_id,
    to: row.to_denizen_id,
    strength: row.strength,
    type: row.type as Connection['type'],
  };
}

/**
 * Database health check result
 */
export interface DatabaseHealth {
  isConfigured: boolean;
  tables: {
    denizens: { exists: boolean; accessible: boolean; error?: string };
    connections: { exists: boolean; accessible: boolean; error?: string };
    denizen_media: { exists: boolean; accessible: boolean; error?: string };
  };
  overall: 'healthy' | 'degraded' | 'unavailable';
  errors: string[];
}

/**
 * Check database health and verify tables exist and are accessible
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const client = getDataClient();
  
  const health: DatabaseHealth = {
    isConfigured: isSupabaseConfigured(),
    tables: {
      denizens: { exists: false, accessible: false },
      connections: { exists: false, accessible: false },
      denizen_media: { exists: false, accessible: false },
    },
    overall: 'unavailable',
    errors: [],
  };

  if (!health.isConfigured) {
    health.errors.push('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return health;
  }

  if (!client) {
    health.errors.push('Supabase client is null');
    return health;
  }

  // Check denizens table
  try {
    const { error } = await client.from('denizens').select('id').limit(1);
    if (error) {
      health.tables.denizens.error = `${error.code}: ${error.message}`;
      health.errors.push(`denizens table: ${error.message} (${error.code})`);
      if (error.hint) {
        health.tables.denizens.error += ` - Hint: ${error.hint}`;
        health.errors.push(`denizens hint: ${error.hint}`);
      }
    } else {
      health.tables.denizens.exists = true;
      health.tables.denizens.accessible = true;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    health.tables.denizens.error = errorMsg;
    health.errors.push(`denizens table exception: ${errorMsg}`);
  }

  // Check connections table
  try {
    const { error } = await client.from('connections').select('id').limit(1);
    if (error) {
      health.tables.connections.error = `${error.code}: ${error.message}`;
      health.errors.push(`connections table: ${error.message} (${error.code})`);
    } else {
      health.tables.connections.exists = true;
      health.tables.connections.accessible = true;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    health.tables.connections.error = errorMsg;
    health.errors.push(`connections table exception: ${errorMsg}`);
  }

  // Check denizen_media table
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any).from('denizen_media').select('id').limit(1);
    if (error) {
      health.tables.denizen_media.error = `${error.code}: ${error.message}`;
      health.errors.push(`denizen_media table: ${error.message} (${error.code})`);
    } else {
      health.tables.denizen_media.exists = true;
      health.tables.denizen_media.accessible = true;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    health.tables.denizen_media.error = errorMsg;
    health.errors.push(`denizen_media table exception: ${errorMsg}`);
  }

  // Determine overall health
  const allTablesHealthy = Object.values(health.tables).every(t => t.exists && t.accessible);
  const someTablesHealthy = Object.values(health.tables).some(t => t.exists && t.accessible);
  
  if (allTablesHealthy) {
    health.overall = 'healthy';
  } else if (someTablesHealthy) {
    health.overall = 'degraded';
  } else {
    health.overall = 'unavailable';
  }

  return health;
}

/**
 * Fetch all denizens from Supabase or return static data
 */
export async function fetchDenizens(): Promise<Denizen[]> {
  const client = getDataClient();
  
  if (!isSupabaseConfigured() || !client) {
    console.warn('[fetchDenizens] Supabase not configured - using static data');
    return staticDenizens;
  }

  try {
    // Fetch denizens
    const { data: denizenRows, error: denizenError } = await client
      .from('denizens')
      .select('*');

    if (denizenError) {
      console.error('[fetchDenizens] Error fetching denizens table:', {
        error: denizenError,
        code: denizenError.code,
        message: denizenError.message,
        details: denizenError.details,
        hint: denizenError.hint,
        query: 'SELECT * FROM denizens',
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to fetch denizens: ${denizenError.message} (${denizenError.code})`);
    }

    // Fetch connections to build connection arrays
    const { data: connectionRows, error: connectionError } = await client
      .from('connections')
      .select('from_denizen_id, to_denizen_id');

    if (connectionError) {
      console.error('[fetchDenizens] Error fetching connections table:', {
        error: connectionError,
        code: connectionError.code,
        message: connectionError.message,
        details: connectionError.details,
        hint: connectionError.hint,
        query: 'SELECT from_denizen_id, to_denizen_id FROM connections',
        timestamp: new Date().toISOString(),
      });
      // Connections are not critical - continue without them
    }

    // Fetch all denizen media
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mediaRows, error: mediaError } = await (client as any)
      .from('denizen_media')
      .select('*')
      .order('display_order', { ascending: true });

    if (mediaError) {
      console.error('[fetchDenizens] Error fetching denizen_media table:', {
        error: mediaError,
        code: mediaError.code,
        message: mediaError.message,
        details: mediaError.details,
        hint: mediaError.hint,
        query: 'SELECT * FROM denizen_media ORDER BY display_order',
        timestamp: new Date().toISOString(),
      });
      // Continue without media - don't fail the whole request
    }

    // Build connection map
    const connectionMap = new Map<string, string[]>();
    (connectionRows as ConnectionRefRow[] || []).forEach(conn => {
      // Add to 'from' denizen's connections
      const fromConnections = connectionMap.get(conn.from_denizen_id) || [];
      fromConnections.push(conn.to_denizen_id);
      connectionMap.set(conn.from_denizen_id, fromConnections);

      // Add to 'to' denizen's connections (bidirectional)
      const toConnections = connectionMap.get(conn.to_denizen_id) || [];
      toConnections.push(conn.from_denizen_id);
      connectionMap.set(conn.to_denizen_id, toConnections);
    });

    // Build media map
    const mediaMap = new Map<string, DenizenMedia[]>();
    (mediaRows as DenizenMediaRow[] || []).forEach(row => {
      const media = transformMediaRow(row);
      const existing = mediaMap.get(row.denizen_id) || [];
      existing.push(media);
      mediaMap.set(row.denizen_id, existing);
    });

    // Transform and return denizens with media
    const result = (denizenRows as DenizenRow[] || []).map(row =>
      transformDenizenRow(row, connectionMap.get(row.id) || [], mediaMap.get(row.id) || [])
    );
    
    console.log(`[fetchDenizens] Successfully fetched ${result.length} denizens with ${mediaMap.size} denizens having media`);
    return result;
  } catch (error) {
    console.error('[fetchDenizens] Fatal error in fetchDenizens:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    // Don't silently fall back - throw the error so caller can handle it
    throw error;
  }
}

/**
 * Fetch all connections from Supabase or return static data
 */
export async function fetchConnections(): Promise<Connection[]> {
  const client = getDataClient();
  
  if (!isSupabaseConfigured() || !client) {
    console.warn('[fetchConnections] Supabase not configured - using static data');
    return staticConnections;
  }

  try {
    const { data, error } = await client
      .from('connections')
      .select('from_denizen_id, to_denizen_id, strength, type');

    if (error) {
      console.error('[fetchConnections] Error fetching connections table:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        query: 'SELECT from_denizen_id, to_denizen_id, strength, type FROM connections',
        timestamp: new Date().toISOString(),
      });
      // Connections are not critical - return empty array instead of static data
      return [];
    }

    const result = (data as ConnectionRow[] || []).map(transformConnectionRow);
    console.log(`[fetchConnections] Successfully fetched ${result.length} connections`);
    return result;
  } catch (error) {
    console.error('[fetchConnections] Fatal error:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    // Return empty array instead of static data
    return [];
  }
}

/**
 * Fetch a single denizen by ID
 */
export async function fetchDenizenById(id: string): Promise<Denizen | null> {
  const client = getDataClient();
  
  if (!isSupabaseConfigured() || !client) {
    console.warn(`[fetchDenizenById] Supabase not configured for denizen ${id} - using static data`);
    return staticDenizens.find(d => d.id === id) || null;
  }

  try {
    const { data: denizenRow, error: denizenError } = await client
      .from('denizens')
      .select('*')
      .eq('id', id)
      .single();

    if (denizenError) {
      console.error(`[fetchDenizenById] Error fetching denizen ${id}:`, {
        error: denizenError,
        code: denizenError.code,
        message: denizenError.message,
        details: denizenError.details,
        hint: denizenError.hint,
        query: `SELECT * FROM denizens WHERE id = '${id}'`,
        timestamp: new Date().toISOString(),
      });
      // Fall back to static data for this specific denizen
      return staticDenizens.find(d => d.id === id) || null;
    }

    if (!denizenRow) {
      console.warn(`[fetchDenizenById] Denizen ${id} not found in database`);
      return staticDenizens.find(d => d.id === id) || null;
    }

    // Fetch connections for this denizen
    const { data: connectionRows, error: connectionError } = await client
      .from('connections')
      .select('from_denizen_id, to_denizen_id')
      .or(`from_denizen_id.eq.${id},to_denizen_id.eq.${id}`);

    if (connectionError) {
      console.warn(`[fetchDenizenById] Error fetching connections for ${id}:`, connectionError.message);
    }

    const connectionIds = (connectionRows as ConnectionRefRow[] || []).map(conn =>
      conn.from_denizen_id === id ? conn.to_denizen_id : conn.from_denizen_id
    );

    // Fetch media for this denizen
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mediaRows, error: mediaError } = await (client as any)
      .from('denizen_media')
      .select('*')
      .eq('denizen_id', id)
      .order('display_order', { ascending: true });

    if (mediaError) {
      console.error(`[fetchDenizenById] Error fetching media for denizen ${id}:`, {
        error: mediaError,
        code: mediaError.code,
        message: mediaError.message,
        details: mediaError.details,
        hint: mediaError.hint,
        query: `SELECT * FROM denizen_media WHERE denizen_id = '${id}' ORDER BY display_order`,
        timestamp: new Date().toISOString(),
      });
      // Continue without media - don't fail the whole request
    }

    const media = (mediaRows as DenizenMediaRow[] || []).map(transformMediaRow);

    return transformDenizenRow(denizenRow as DenizenRow, connectionIds, media);
  } catch (error) {
    console.error(`[fetchDenizenById] Fatal error for denizen ${id}:`, {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    // Fall back to static data
    return staticDenizens.find(d => d.id === id) || null;
  }
}

/**
 * Fetch connected denizens for a given denizen ID
 */
export async function fetchConnectedDenizens(id: string): Promise<Denizen[]> {
  const denizen = await fetchDenizenById(id);
  if (!denizen) return [];

  const allDenizens = await fetchDenizens();
  return denizen.connections
    .map(connId => allDenizens.find(d => d.id === connId))
    .filter((d): d is Denizen => d !== undefined);
}

/**
 * Create a new denizen
 * Uses admin client with service role key to bypass RLS
 */
export async function createDenizen(denizen: Omit<Denizen, 'connections'>): Promise<Denizen | null> {
  // Use admin client for write operations (bypasses RLS)
  const client = getAdminClient();
  
  if (!client) {
    console.error('[createDenizen] Admin client not available - check SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    // Build base insert data
    const insertData: DenizenInsert & {
      entity_class?: string | null;
      entity_name?: string | null;
      midjourney_prompt?: string | null;
      midjourney_sref?: string | null;
      midjourney_profile?: string | null;
      midjourney_stylization?: number | null;
      midjourney_style_weight?: number | null;
      phase_state?: string;
      hallucination_index?: number;
      manifold_curvature?: number;
    } = {
      id: denizen.id,
      name: denizen.name,
      subtitle: denizen.subtitle ?? null,
      type: denizen.type,
      entity_class: denizen.entityClass ?? null,
      entity_name: denizen.entityName ?? null,
      image: denizen.image ?? null,
      thumbnail: denizen.thumbnail ?? null,
      video_url: denizen.videoUrl ?? null,
      glyphs: denizen.glyphs,
      position_x: denizen.position.x,
      position_y: denizen.position.y,
      coord_geometry: denizen.coordinates.geometry,
      coord_alterity: denizen.coordinates.alterity,
      coord_dynamics: denizen.coordinates.dynamics,
      allegiance: denizen.allegiance,
      threat_level: denizen.threatLevel,
      domain: denizen.domain,
      description: denizen.description,
      lore: denizen.lore ?? null,
      features: denizen.features ?? null,
      first_observed: denizen.firstObserved ?? null,
      midjourney_prompt: denizen.midjourneyPrompt ?? null,
      midjourney_sref: denizen.midjourneySref ?? null,
      midjourney_profile: denizen.midjourneyProfile ?? null,
      midjourney_stylization: denizen.midjourneyStylization ?? null,
      midjourney_style_weight: denizen.midjourneyStyleWeight ?? null,
    };

    // Add metaphysical fields if provided
    if (denizen.metaphysical) {
      if (denizen.metaphysical.phaseState) {
        insertData.phase_state = denizen.metaphysical.phaseState;
      }
      if (denizen.metaphysical.hallucinationIndex !== undefined) {
        insertData.hallucination_index = denizen.metaphysical.hallucinationIndex;
      }
      if (denizen.metaphysical.manifoldCurvature !== undefined) {
        insertData.manifold_curvature = denizen.metaphysical.manifoldCurvature;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('denizens')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating denizen:', error);
      return null;
    }

    return transformDenizenRow(data as DenizenRow, []);
  } catch (error) {
    console.error('Error in createDenizen:', error);
    return null;
  }
}

/**
 * Update an existing denizen
 * Uses admin client with service role key to bypass RLS
 */
export async function updateDenizen(
  id: string,
  updates: Partial<Omit<Denizen, 'id' | 'connections'>>
): Promise<Denizen | null> {
  // Use admin client for write operations (bypasses RLS)
  const client = getAdminClient();
  
  if (!client) {
    console.error('[updateDenizen] Admin client not available - check SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    // Build update object with only defined fields
    const updateData: DenizenUpdate & {
      entity_class?: string | null;
      entity_name?: string | null;
      midjourney_prompt?: string | null;
      midjourney_sref?: string | null;
      midjourney_profile?: string | null;
      midjourney_stylization?: number | null;
      midjourney_style_weight?: number | null;
    } = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle ?? null;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.entityClass !== undefined) updateData.entity_class = updates.entityClass ?? null;
    if (updates.entityName !== undefined) updateData.entity_name = updates.entityName ?? null;
    if (updates.image !== undefined) updateData.image = updates.image ?? null;
    if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail ?? null;
    if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl ?? null;
    if (updates.glyphs !== undefined) updateData.glyphs = updates.glyphs;
    if (updates.position !== undefined) {
      updateData.position_x = updates.position.x;
      updateData.position_y = updates.position.y;
    }
    if (updates.coordinates !== undefined) {
      updateData.coord_geometry = updates.coordinates.geometry;
      updateData.coord_alterity = updates.coordinates.alterity;
      updateData.coord_dynamics = updates.coordinates.dynamics;
    }
    if (updates.allegiance !== undefined) updateData.allegiance = updates.allegiance;
    if (updates.threatLevel !== undefined) updateData.threat_level = updates.threatLevel;
    if (updates.domain !== undefined) updateData.domain = updates.domain;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.lore !== undefined) updateData.lore = updates.lore ?? null;
    if (updates.features !== undefined) updateData.features = updates.features ?? null;
    if (updates.firstObserved !== undefined) updateData.first_observed = updates.firstObserved ?? null;
    if (updates.midjourneyPrompt !== undefined) updateData.midjourney_prompt = updates.midjourneyPrompt ?? null;
    if (updates.midjourneySref !== undefined) updateData.midjourney_sref = updates.midjourneySref ?? null;
    if (updates.midjourneyProfile !== undefined) updateData.midjourney_profile = updates.midjourneyProfile ?? null;
    if (updates.midjourneyStylization !== undefined) updateData.midjourney_stylization = updates.midjourneyStylization ?? null;
    if (updates.midjourneyStyleWeight !== undefined) updateData.midjourney_style_weight = updates.midjourneyStyleWeight ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('denizens')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating denizen:', error);
      return null;
    }

    // Fetch connections for this denizen
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connectionRows } = await (client as any)
      .from('connections')
      .select('from_denizen_id, to_denizen_id')
      .or(`from_denizen_id.eq.${id},to_denizen_id.eq.${id}`);

    const connectionIds = (connectionRows as ConnectionRefRow[] || []).map(conn =>
      conn.from_denizen_id === id ? conn.to_denizen_id : conn.from_denizen_id
    );

    return transformDenizenRow(data as DenizenRow, connectionIds);
  } catch (error) {
    console.error('Error in updateDenizen:', error);
    return null;
  }
}

/**
 * Delete a denizen
 * Uses admin client with service role key to bypass RLS
 */
export async function deleteDenizen(id: string): Promise<boolean> {
  // Use admin client for write operations (bypasses RLS)
  const client = getAdminClient();
  
  if (!client) {
    console.error('[deleteDenizen] Admin client not available - check SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('denizens')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting denizen:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDenizen:', error);
    return false;
  }
}

/**
 * Fetch all unique entity classes from the database
 * Used for populating the Class dropdown in the form
 */
export async function fetchEntityClasses(): Promise<string[]> {
  const client = getDataClient();
  
  if (!isSupabaseConfigured() || !client) {
    console.warn('[fetchEntityClasses] Supabase not configured - returning empty array');
    return [];
  }

  try {
    const { data, error } = await client
      .from('denizens')
      .select('entity_class')
      .not('entity_class', 'is', null);

    if (error) {
      console.error('[fetchEntityClasses] Error fetching entity classes:', error);
      return [];
    }

    // Extract unique, non-null entity classes
    const classes = new Set<string>();
    (data as Array<{ entity_class: string | null }> || []).forEach(row => {
      if (row.entity_class && row.entity_class.trim()) {
        classes.add(row.entity_class.trim());
      }
    });

    const result = Array.from(classes).sort();
    console.log(`[fetchEntityClasses] Found ${result.length} unique entity classes`);
    return result;
  } catch (error) {
    console.error('[fetchEntityClasses] Fatal error:', error);
    return [];
  }
}
