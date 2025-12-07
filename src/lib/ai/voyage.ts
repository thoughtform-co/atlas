/**
 * Voyage AI Embeddings Service
 * Requires: VOYAGE_API_KEY environment variable
 */

import { VOYAGE_CONFIG, isVoyageConfigured } from './config';
import type { VoyageEmbeddingResponse, AIServiceError } from './types';

/**
 * Voyage AI API base URL
 */
const VOYAGE_API_URL = 'https://api.voyageai.com/v1';

/**
 * Make a request to the Voyage AI API
 */
async function voyageRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  if (!isVoyageConfigured()) {
    throw new Error(
      'Voyage AI not configured. Please set VOYAGE_API_KEY environment variable.'
    );
  }

  const response = await fetch(`${VOYAGE_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOYAGE_CONFIG.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Voyage AI API error (${response.status}): ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Generate an embedding for a single text input
 *
 * @param text - Text to generate embedding for
 * @param inputType - Type of input: 'document' (default) or 'query'
 * @returns Array of numbers representing the embedding vector
 * @throws AIServiceError if embedding generation fails
 */
export async function generateEmbedding(
  text: string,
  inputType: 'document' | 'query' = 'document'
): Promise<number[]> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const response = await voyageRequest<VoyageEmbeddingResponse>(
      '/embeddings',
      {
        input: [text],
        model: VOYAGE_CONFIG.model,
        input_type: inputType,
      }
    );

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data in response');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding with Voyage AI:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'voyage',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Generate embeddings for multiple text inputs (batch processing)
 *
 * @param texts - Array of texts to generate embeddings for
 * @param inputType - Type of input: 'document' (default) or 'query'
 * @returns Array of embedding vectors
 * @throws AIServiceError if embedding generation fails
 */
export async function generateEmbeddings(
  texts: string[],
  inputType: 'document' | 'query' = 'document'
): Promise<number[][]> {
  try {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    if (texts.some((text) => !text || text.trim().length === 0)) {
      throw new Error('All texts must be non-empty strings');
    }

    // Voyage AI has a limit on batch size, typically 128 inputs
    // Split into chunks if needed
    const BATCH_SIZE = 128;
    const batches: string[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const response = await voyageRequest<VoyageEmbeddingResponse>(
        '/embeddings',
        {
          input: batch,
          model: VOYAGE_CONFIG.model,
          input_type: inputType,
        }
      );

      if (!response.data || response.data.length !== batch.length) {
        throw new Error(
          `Expected ${batch.length} embeddings, got ${response.data?.length || 0}`
        );
      }

      // Sort by index to ensure correct order
      const sortedEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      allEmbeddings.push(...sortedEmbeddings);
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Error generating embeddings with Voyage AI:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'voyage',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Generate embedding for a denizen based on its key attributes
 * Combines name, description, domain, and features into a searchable text
 *
 * @param denizen - Partial denizen object with at least name and description
 * @returns Embedding vector
 */
export async function generateDenizenEmbedding(denizen: {
  name: string;
  description: string;
  domain?: string;
  features?: string[];
  lore?: string;
}): Promise<number[]> {
  // Combine denizen attributes into a rich text representation
  const parts: string[] = [
    `Name: ${denizen.name}`,
    `Description: ${denizen.description}`,
  ];

  if (denizen.domain) {
    parts.push(`Domain: ${denizen.domain}`);
  }

  if (denizen.features && denizen.features.length > 0) {
    parts.push(`Features: ${denizen.features.join(', ')}`);
  }

  if (denizen.lore) {
    parts.push(`Lore: ${denizen.lore}`);
  }

  const text = parts.join('\n\n');

  return generateEmbedding(text, 'document');
}

/**
 * Generate embedding optimized for search queries
 * Use this when searching for entities based on user input
 *
 * @param query - Search query text
 * @returns Embedding vector optimized for similarity search
 */
export async function generateSearchEmbedding(query: string): Promise<number[]> {
  return generateEmbedding(query, 'query');
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between -1 (opposite) and 1 (identical)
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimensions must match: ${a.length} vs ${b.length}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
