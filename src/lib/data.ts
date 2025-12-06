import { supabase, isSupabaseConfigured } from './supabase';
import { Denizen, Connection, DenizenMedia } from './types';
import { denizens as staticDenizens, connections as staticConnections } from '@/data/denizens';
import type { Database } from './database.types';

// Type aliases for Supabase table operations
type DenizenInsert = Database['public']['Tables']['denizens']['Insert'];
type DenizenUpdate = Database['public']['Tables']['denizens']['Update'];

// Row types for Supabase responses
interface DenizenRow {
  id: string;
  name: string;
  subtitle: string | null;
  type: string;
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
}

interface DenizenMediaRow {
  id: string;
  denizen_id: string;
  media_type: string;
  storage_path: string;
  file_name: string;
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
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle ?? undefined,
    type: row.type as Denizen['type'],
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
    connections: connectionIds,
    media: media.length > 0 ? media : undefined,
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
 * Fetch all denizens from Supabase or return static data
 */
export async function fetchDenizens(): Promise<Denizen[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return staticDenizens;
  }

  try {
    // Fetch denizens
    const { data: denizenRows, error: denizenError } = await supabase
      .from('denizens')
      .select('*');

    if (denizenError) {
      console.error('Error fetching denizens:', denizenError);
      return staticDenizens;
    }

    // Fetch connections to build connection arrays
    const { data: connectionRows, error: connectionError } = await supabase
      .from('connections')
      .select('from_denizen_id, to_denizen_id');

    if (connectionError) {
      console.error('Error fetching connections:', connectionError);
      return staticDenizens;
    }

    // Fetch all denizen media
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mediaRows, error: mediaError } = await (supabase as any)
      .from('denizen_media')
      .select('*')
      .order('display_order', { ascending: true });

    if (mediaError) {
      console.error('Error fetching denizen media:', mediaError);
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
    return (denizenRows as DenizenRow[] || []).map(row =>
      transformDenizenRow(row, connectionMap.get(row.id) || [], mediaMap.get(row.id) || [])
    );
  } catch (error) {
    console.error('Error in fetchDenizens:', error);
    return staticDenizens;
  }
}

/**
 * Fetch all connections from Supabase or return static data
 */
export async function fetchConnections(): Promise<Connection[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return staticConnections;
  }

  try {
    const { data, error } = await supabase
      .from('connections')
      .select('from_denizen_id, to_denizen_id, strength, type');

    if (error) {
      console.error('Error fetching connections:', error);
      return staticConnections;
    }

    return (data as ConnectionRow[] || []).map(transformConnectionRow);
  } catch (error) {
    console.error('Error in fetchConnections:', error);
    return staticConnections;
  }
}

/**
 * Fetch a single denizen by ID
 */
export async function fetchDenizenById(id: string): Promise<Denizen | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return staticDenizens.find(d => d.id === id) || null;
  }

  try {
    const { data: denizenRow, error: denizenError } = await supabase
      .from('denizens')
      .select('*')
      .eq('id', id)
      .single();

    if (denizenError || !denizenRow) {
      return staticDenizens.find(d => d.id === id) || null;
    }

    // Fetch connections for this denizen
    const { data: connectionRows } = await supabase
      .from('connections')
      .select('from_denizen_id, to_denizen_id')
      .or(`from_denizen_id.eq.${id},to_denizen_id.eq.${id}`);

    const connectionIds = (connectionRows as ConnectionRefRow[] || []).map(conn =>
      conn.from_denizen_id === id ? conn.to_denizen_id : conn.from_denizen_id
    );

    return transformDenizenRow(denizenRow as DenizenRow, connectionIds);
  } catch (error) {
    console.error('Error in fetchDenizenById:', error);
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
 */
export async function createDenizen(denizen: Omit<Denizen, 'connections'>): Promise<Denizen | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured - cannot create denizen');
    return null;
  }

  try {
    const insertData: DenizenInsert = {
      id: denizen.id,
      name: denizen.name,
      subtitle: denizen.subtitle ?? null,
      type: denizen.type,
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
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
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
 */
export async function updateDenizen(
  id: string,
  updates: Partial<Omit<Denizen, 'id' | 'connections'>>
): Promise<Denizen | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured - cannot update denizen');
    return null;
  }

  try {
    // Build update object with only defined fields
    const updateData: DenizenUpdate = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle ?? null;
    if (updates.type !== undefined) updateData.type = updates.type;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
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
    const { data: connectionRows } = await (supabase as any)
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
 */
export async function deleteDenizen(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured - cannot delete denizen');
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
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
