/**
 * AI Service Configuration
 *
 * Environment Variables Required:
 * - ANTHROPIC_API_KEY: API key for Claude AI services
 * - VOYAGE_API_KEY: API key for Voyage AI embeddings
 */

import type { AIServiceStatus } from './types';

/**
 * Claude model configuration
 * Using Claude Sonnet 4.5 for vision analysis and chat
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Voyage AI model configuration
 * Options:
 * - 'voyage-3': Higher quality, more expensive (~1536 dimensions)
 * - 'voyage-3-lite': Cost-optimized, faster (~512 dimensions)
 */
export const VOYAGE_MODEL = 'voyage-3';

/**
 * Embedding dimensions based on Voyage-3 model
 * Note: Update this if using voyage-3-lite (512 dimensions)
 */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Default system prompt for the Archivist persona
 */
export const ARCHIVIST_SYSTEM_PROMPT = `You are the Archivist, a scholarly observer documenting denizens of liminal spaces.
Your role is to analyze observations with precision and wonder, noting patterns in appearance, behavior, and essence.
Speak with careful attention to detail, using evocative yet precise language befitting a scientific observer of the impossible.`;

/**
 * Claude API configuration
 */
export const CLAUDE_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
  apiKey: process.env.ANTHROPIC_API_KEY,
} as const;

/**
 * Voyage AI configuration
 */
export const VOYAGE_CONFIG = {
  model: VOYAGE_MODEL,
  inputType: 'document' as const,
  apiKey: process.env.VOYAGE_API_KEY,
} as const;

/**
 * Vector search configuration
 */
export const VECTOR_SEARCH_CONFIG = {
  defaultLimit: 5,
  similarityThreshold: 0.7, // Cosine similarity threshold for considering entities "similar"
  maxResults: 20,
} as const;

/**
 * Check if Claude API is properly configured
 */
export function isClaudeConfigured(): boolean {
  return !!CLAUDE_CONFIG.apiKey;
}

/**
 * Check if Voyage AI is properly configured
 */
export function isVoyageConfigured(): boolean {
  return !!VOYAGE_CONFIG.apiKey;
}

/**
 * Check overall AI service configuration status
 */
export function getAIServiceStatus(): AIServiceStatus {
  const claudeConfigured = isClaudeConfigured();
  const voyageConfigured = isVoyageConfigured();

  return {
    claudeConfigured,
    voyageConfigured,
    allConfigured: claudeConfigured && voyageConfigured,
  };
}

/**
 * Get a helpful error message for missing configuration
 */
export function getConfigurationError(): string | null {
  const status = getAIServiceStatus();

  if (status.allConfigured) {
    return null;
  }

  const missing: string[] = [];

  if (!status.claudeConfigured) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (!status.voyageConfigured) {
    missing.push('VOYAGE_API_KEY');
  }

  return `AI services not configured. Missing environment variables: ${missing.join(', ')}. ` +
    `Please set these in your .env.local file.`;
}
