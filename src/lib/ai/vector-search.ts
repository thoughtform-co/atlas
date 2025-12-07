/**
 * Vector Similarity Search using Supabase pgvector
 *
 * This module requires:
 * 1. Supabase database with pgvector extension enabled
 * 2. denizens table with embedding_signature column (vector type)
 * 3. archive_log table with embedding column (vector type) - optional
 *
 * Setup SQL:
 * ```sql
 * -- Enable pgvector extension
 * CREATE EXTENSION IF NOT EXISTS vector;
 *
 * -- Add embedding column to denizens table
 * ALTER TABLE denizens ADD COLUMN embedding_signature vector(1536);
 *
 * -- Create index for faster similarity search
 * CREATE INDEX denizens_embedding_idx ON denizens
 * USING ivfflat (embedding_signature vector_cosine_ops)
 * WITH (lists = 100);
 *
 * -- Optional: Create archive_log table with embeddings
 * CREATE TABLE archive_log (
 *   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   denizen_id uuid REFERENCES denizens(id),
 *   timestamp timestamptz DEFAULT now(),
 *   entry text NOT NULL,
 *   archivist_name text NOT NULL,
 *   tags text[],
 *   embedding vector(1536),
 *   metadata jsonb
 * );
 * ```
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import type { Denizen } from '../types';
import type {
  SimilarEntity,
  ArchiveLogEntry,
  ConsistencyReport,
  AIServiceError,
} from './types';
import { VECTOR_SEARCH_CONFIG } from './config';
import { generateSearchEmbedding, generateDenizenEmbedding } from './voyage';
import { chat } from './claude';

/**
 * Search for denizens similar to a given embedding vector
 *
 * @param embedding - Query embedding vector
 * @param limit - Maximum number of results to return
 * @param threshold - Minimum similarity score (0-1)
 * @returns Array of denizens with similarity scores
 * @throws AIServiceError if search fails
 */
export async function searchSimilarEntities(
  embedding: number[],
  limit: number = VECTOR_SEARCH_CONFIG.defaultLimit,
  threshold: number = VECTOR_SEARCH_CONFIG.similarityThreshold
): Promise<SimilarEntity[]> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }
    
    // Use pgvector's cosine similarity operator (<=>)
    // Note: This uses RPC function for similarity search
    // Type assertion needed due to Supabase generic inference limitations
    const { data, error } = await (supabase as NonNullable<typeof supabase>).rpc(
      'search_denizens_by_embedding',
      {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      } as any
    );

    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform database rows to Denizen objects with similarity scores
    const results: SimilarEntity[] = (data as any[]).map((row: any) => ({
      denizen: {
        id: row.id,
        name: row.name,
        subtitle: row.subtitle,
        type: row.type,
        image: row.image,
        thumbnail: row.thumbnail,
        videoUrl: row.video_url,
        glyphs: row.glyphs,
        position: {
          x: row.position_x,
          y: row.position_y,
        },
        coordinates: {
          geometry: row.coord_geometry,
          alterity: row.coord_alterity,
          dynamics: row.coord_dynamics,
        },
        allegiance: row.allegiance,
        threatLevel: row.threat_level,
        domain: row.domain,
        description: row.description,
        lore: row.lore,
        features: row.features,
        firstObserved: row.first_observed,
        connections: [], // Would need separate query to populate
      },
      similarity: row.similarity,
    }));

    return results;
  } catch (error) {
    console.error('Error searching similar entities:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to search similar entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'vector-search',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Search archive log entries similar to a given embedding
 *
 * @param embedding - Query embedding vector
 * @param limit - Maximum number of results to return
 * @returns Array of archive log entries with similarity scores
 * @throws AIServiceError if search fails
 */
export async function searchArchiveLog(
  embedding: number[],
  limit: number = VECTOR_SEARCH_CONFIG.defaultLimit
): Promise<Array<ArchiveLogEntry & { similarity: number }>> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }
    
    // Type assertion needed due to Supabase generic inference limitations
    const { data, error } = await (supabase as NonNullable<typeof supabase>).rpc(
      'search_archive_log_by_embedding',
      {
        query_embedding: embedding,
        match_count: limit,
      } as any
    );

    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return (data as any[]).map((row: any) => ({
      id: row.id,
      denizenId: row.denizen_id,
      timestamp: row.created_timestamp,
      entry: row.entry,
      archivistName: row.archivist_name,
      tags: row.tags,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
  } catch (error) {
    console.error('Error searching archive log:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to search archive log: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'vector-search',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Search for denizens by text query (converts query to embedding first)
 *
 * @param query - Natural language search query
 * @param limit - Maximum number of results
 * @returns Array of similar denizens
 */
export async function searchByText(
  query: string,
  limit: number = VECTOR_SEARCH_CONFIG.defaultLimit
): Promise<SimilarEntity[]> {
  const embedding = await generateSearchEmbedding(query);
  return searchSimilarEntities(embedding, limit);
}

/**
 * Check consistency of a new entity description against existing denizens
 * Helps identify potential duplicates or conflicting entities
 *
 * @param newEntityDescription - Description of the new entity
 * @param newEntityName - Optional name of the new entity
 * @returns Consistency report with similar entities and potential conflicts
 */
export async function checkConsistency(
  newEntityDescription: string,
  newEntityName?: string
): Promise<ConsistencyReport> {
  try {
    // Generate embedding for the new entity description
    const searchText = newEntityName
      ? `Name: ${newEntityName}\n\nDescription: ${newEntityDescription}`
      : newEntityDescription;

    const embedding = await generateSearchEmbedding(searchText);

    // Search for similar entities
    const similarEntities = await searchSimilarEntities(
      embedding,
      VECTOR_SEARCH_CONFIG.defaultLimit,
      0.6 // Lower threshold for consistency checking
    );

    // Determine if this is likely a duplicate or conflict
    const isConsistent = similarEntities.length === 0 ||
      similarEntities[0].similarity < 0.85; // High similarity suggests duplicate

    const potentialConflicts: string[] = [];
    const suggestions: string[] = [];

    // Analyze similarities for conflicts
    for (const similar of similarEntities) {
      if (similar.similarity > 0.85) {
        potentialConflicts.push(
          `Very similar to "${similar.denizen.name}" (${Math.round(similar.similarity * 100)}% match). ` +
          `This may be a duplicate.`
        );
      } else if (similar.similarity > 0.75) {
        potentialConflicts.push(
          `Shares characteristics with "${similar.denizen.name}" (${Math.round(similar.similarity * 100)}% match). ` +
          `Consider whether these are related entities.`
        );
      }
    }

    // Generate suggestions using Claude if we have similar entities
    if (similarEntities.length > 0) {
      try {
        const similarNames = similarEntities
          .slice(0, 3)
          .map((s) => `- ${s.denizen.name}: ${s.denizen.description.substring(0, 150)}...`)
          .join('\n');

        const aiSuggestion = await chat([
          {
            role: 'user',
            content: `I'm cataloging a new entity: "${newEntityName || 'unnamed'}"\nDescription: ${newEntityDescription}\n\nSimilar entities already in the archive:\n${similarNames}\n\nProvide 2-3 brief suggestions to ensure consistency and avoid duplication.`,
          },
        ]);

        // Parse suggestions (assuming they're in a list format)
        const suggestionMatches = aiSuggestion.match(/[-•]\s*(.+?)(?=\n[-•]|\n\n|$)/gs);
        if (suggestionMatches) {
          suggestions.push(
            ...suggestionMatches.map((s) => s.replace(/^[-•]\s*/, '').trim())
          );
        } else {
          suggestions.push(aiSuggestion);
        }
      } catch (error) {
        console.error('Error generating AI suggestions:', error);
        // Continue without AI suggestions
      }
    }

    if (suggestions.length === 0 && isConsistent) {
      suggestions.push('No similar entities found. This appears to be a unique entry.');
    }

    return {
      isConsistent,
      similarEntities,
      potentialConflicts,
      suggestions,
    };
  } catch (error) {
    console.error('Error checking consistency:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to check consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'vector-search',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Update or create embedding for a denizen
 *
 * @param denizenId - ID of the denizen
 * @param denizen - Denizen data to generate embedding from
 * @returns The generated embedding vector
 */
export async function updateDenizenEmbedding(
  denizenId: string,
  denizen: {
    name: string;
    description: string;
    domain?: string;
    features?: string[];
    lore?: string;
  }
): Promise<number[]> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Generate embedding
    const embedding = await generateDenizenEmbedding(denizen);

    // Update denizen record with embedding
    // Type assertion needed due to Supabase generic inference limitations with pgvector types
    const client = supabase as NonNullable<typeof supabase>;
    const { error } = await client
      .from('denizens')
      // @ts-ignore pgvector embedding type not supported by generated types
      .update({ embedding_signature: embedding })
      .eq('id', denizenId);

    if (error) {
      throw new Error(`Failed to update denizen embedding: ${error.message}`);
    }

    return embedding;
  } catch (error) {
    console.error('Error updating denizen embedding:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to update denizen embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'vector-search',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Batch update embeddings for all denizens (useful for initial setup)
 * Warning: This can be expensive with many entities!
 *
 * @param batchSize - Number of denizens to process at once
 * @returns Number of embeddings generated
 */
export async function batchUpdateAllEmbeddings(
  batchSize: number = 10
): Promise<number> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Fetch all denizens
    // Type assertion needed due to Supabase generic inference limitations
    const client = supabase as NonNullable<typeof supabase>;
    const { data, error } = await client
      .from('denizens')
      .select('id, name, description, domain, lore, features');

    if (error) {
      throw new Error(`Failed to fetch denizens: ${error.message}`);
    }

    // Cast data to proper type (needed due to Supabase inference issues)
    const denizens = data as Array<{
      id: string;
      name: string;
      description: string;
      domain?: string;
      lore?: string;
      features?: string[];
    }> | null;

    if (!denizens || denizens.length === 0) {
      return 0;
    }

    let updated = 0;

    // Process in batches to avoid rate limits
    for (let i = 0; i < denizens.length; i += batchSize) {
      const batch = denizens.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (denizen) => {
          try {
            await updateDenizenEmbedding(denizen.id, denizen);
            updated++;
            console.log(`Updated embedding for ${denizen.name} (${updated}/${denizens.length})`);
          } catch (error) {
            console.error(`Failed to update embedding for ${denizen.name}:`, error);
          }
        })
      );

      // Rate limiting pause between batches
      if (i + batchSize < denizens.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return updated;
  } catch (error) {
    console.error('Error in batch update:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to batch update embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'vector-search',
      originalError: error,
    } as AIServiceError;
  }
}
