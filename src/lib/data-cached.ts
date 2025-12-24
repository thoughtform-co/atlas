'use cache';

/**
 * Cached Data Functions for Server Components
 * 
 * These functions use Next.js 16's 'use cache' directive and are meant
 * to be imported ONLY by Server Components (not Client Components).
 * 
 * For Client Components, use the functions from ./data.ts directly.
 */

import { cacheTag, cacheLife } from 'next/cache';
import { 
  fetchDenizens as fetchDenizensUncached,
  fetchConnections as fetchConnectionsUncached,
  fetchDenizenById as fetchDenizenByIdUncached,
  fetchEntityTypes as fetchEntityTypesUncached,
  fetchEntityClasses as fetchEntityClassesUncached,
} from './data';
import type { Denizen, Connection } from './types';

/**
 * Fetch all denizens with caching
 * Cached for 1 hour, invalidate with revalidateTag('denizens')
 */
export async function fetchDenizensCached(): Promise<Denizen[]> {
  cacheTag('denizens');
  cacheLife('hours');
  return fetchDenizensUncached();
}

/**
 * Fetch all connections with caching
 * Cached for 1 hour, invalidate with revalidateTag('connections')
 */
export async function fetchConnectionsCached(): Promise<Connection[]> {
  cacheTag('connections');
  cacheLife('hours');
  return fetchConnectionsUncached();
}

/**
 * Fetch a single denizen by ID with caching
 * Cached for 1 hour, invalidate with revalidateTag('denizens') or revalidateTag('denizen-{id}')
 */
export async function fetchDenizenByIdCached(id: string): Promise<Denizen | null> {
  cacheTag('denizens');
  cacheTag(`denizen-${id}`);
  cacheLife('hours');
  return fetchDenizenByIdUncached(id);
}

/**
 * Fetch entity types with caching
 * Cached for 1 day (types rarely change)
 */
export async function fetchEntityTypesCached(): Promise<string[]> {
  cacheTag('entity-types');
  cacheTag('denizens');
  cacheLife('days');
  return fetchEntityTypesUncached();
}

/**
 * Fetch entity classes with caching
 * Cached for 1 day (classes rarely change)
 */
export async function fetchEntityClassesCached(): Promise<string[]> {
  cacheTag('entity-classes');
  cacheTag('denizens');
  cacheLife('days');
  return fetchEntityClassesUncached();
}

