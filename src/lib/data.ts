import { supabase, isSupabaseConfigured } from './supabase';
import { Denizen, Connection } from './types';
import { denizens as staticDenizens, connections as staticConnections } from '@/data/denizens';

// Row types for Supabase responses
interface DenizenRow {
  id: string;
  name: string;
  subtitle: string | null;
  type: string;
  image: string | null;
  thumbnail: string | null;
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
 * Transform Supabase row to Denizen type
 */
function transformDenizenRow(row: DenizenRow, connectionIds: string[]): Denizen {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle ?? undefined,
    type: row.type as Denizen['type'],
    image: row.image ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
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

    // Transform and return denizens
    return (denizenRows as DenizenRow[] || []).map(row =>
      transformDenizenRow(row, connectionMap.get(row.id) || [])
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
