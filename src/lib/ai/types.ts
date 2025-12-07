/**
 * Type definitions for AI services (Claude Vision, Voyage Embeddings)
 */

import type { Denizen } from '../types';

/**
 * Analysis result from Claude vision API for video content
 */
export interface VideoAnalysis {
  appearance: {
    colors: string[];
    shapes: string[];
    textures: string[];
    size: string;
    luminosity: string;
  };
  behavior: {
    movement: string;
    patterns: string[];
    rhythm: string;
  };
  qualities: {
    mood: string;
    energy: string;
    stability: string;
  };
  suggestedFields: {
    phaseState?: string;
    hallucinationIndex?: number;
    manifoldCurvature?: number;
    threatLevel?: 'Benign' | 'Cautious' | 'Volatile' | 'Existential';
    type?: 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';
  };
  rawDescription: string;
}

/**
 * Analysis result from Claude vision API for image content
 */
export interface ImageAnalysis {
  appearance: {
    colors: string[];
    shapes: string[];
    textures: string[];
    composition: string;
    lighting: string;
  };
  symbolism: {
    glyphs?: string[];
    patterns?: string[];
    meanings?: string[];
  };
  qualities: {
    mood: string;
    energy: string;
    presence: string;
  };
  suggestedFields: {
    domain?: string;
    allegiance?: 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';
    features?: string[];
  };
  rawDescription: string;
}

/**
 * Message format for Claude chat completion
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Voyage AI embedding response format
 */
export interface VoyageEmbeddingResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

/**
 * Result of vector similarity search with similarity score
 */
export interface SimilarEntity {
  denizen: Denizen;
  similarity: number;
}

/**
 * Archive log entry for tracking entity observations
 * Note: This assumes an archive_log table exists in the database
 */
export interface ArchiveLogEntry {
  id: string;
  denizenId?: string;
  timestamp: string;
  entry: string;
  archivistName: string;
  tags?: string[];
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Consistency check report for new entity descriptions
 */
export interface ConsistencyReport {
  isConsistent: boolean;
  similarEntities: SimilarEntity[];
  potentialConflicts: string[];
  suggestions: string[];
}

/**
 * Configuration status for AI services
 */
export interface AIServiceStatus {
  claudeConfigured: boolean;
  voyageConfigured: boolean;
  allConfigured: boolean;
}

/**
 * Error types for AI service operations
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly service: 'claude' | 'voyage' | 'vector-search',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}
