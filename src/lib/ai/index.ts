/**
 * Atlas AI Service Layer
 *
 * Provides integration with Claude AI for vision analysis and chat,
 * Voyage AI for embeddings, and pgvector for similarity search.
 *
 * Required Environment Variables:
 * - ANTHROPIC_API_KEY: API key for Claude AI
 * - VOYAGE_API_KEY: API key for Voyage AI embeddings
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
 */

// Configuration
export {
  CLAUDE_MODEL,
  VOYAGE_MODEL,
  EMBEDDING_DIMENSIONS,
  ARCHIVIST_SYSTEM_PROMPT,
  CLAUDE_CONFIG,
  VOYAGE_CONFIG,
  VECTOR_SEARCH_CONFIG,
  isClaudeConfigured,
  isVoyageConfigured,
  getAIServiceStatus,
  getConfigurationError,
} from './config';

// Claude AI Services
export {
  analyzeVideo,
  analyzeImage,
  chat,
  extractEntityInfo,
} from './claude';

// Voyage AI Embeddings
export {
  generateEmbedding,
  generateEmbeddings,
  generateDenizenEmbedding,
  generateSearchEmbedding,
  cosineSimilarity,
} from './voyage';

// Vector Similarity Search
export {
  searchSimilarEntities,
  searchArchiveLog,
  searchByText,
  checkConsistency,
  updateDenizenEmbedding,
  batchUpdateAllEmbeddings,
} from './vector-search';

// Gemini AI for Media Analysis
export {
  analyzeImage as analyzeImageWithGemini,
  analyzeVideo as analyzeVideoWithGemini,
  analyzeMediaUrl,
  isGeminiConfigured,
} from './gemini';

export type {
  EntityAnalysisData,
  EntityAnalysisResult,
} from './gemini';

// Type Definitions
export type {
  VideoAnalysis,
  ImageAnalysis,
  Message,
  VoyageEmbeddingResponse,
  SimilarEntity,
  ArchiveLogEntry,
  ConsistencyReport,
  AIServiceStatus,
  AIServiceError,
} from './types';
