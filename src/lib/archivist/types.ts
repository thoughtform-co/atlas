import type { Denizen, DenizenType, Allegiance, ThreatLevel } from '@/lib/types';

/**
 * Extended classification parameters for mystical/liminal entities
 * These may be stored in domain, lore, or as metadata
 */
export type PhaseState = 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized';

export interface ExtendedClassification {
  phaseState?: PhaseState;
  superposition?: string[];  // Multiple potential states the entity might occupy
  hallucinationIndex?: number;  // 0-1: how "real" vs "imagined"
  manifoldCurvature?: number;  // Local distortion in narrative space
}

/**
 * Media analysis from uploaded images/videos
 * This is what the Archivist receives as initial input
 */
export interface MediaAnalysis {
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  visualDescription?: string;
  detectedColors?: string[];
  mood?: string;
  suggestedName?: string;
  suggestedType?: DenizenType;
}

/**
 * Extracted fields during an Archivist session
 * Gradually built up through conversation
 */
export interface ExtractedFields {
  name?: string;
  subtitle?: string;
  type?: DenizenType;
  allegiance?: Allegiance;
  threatLevel?: ThreatLevel;
  domain?: string;
  description?: string;
  lore?: string;
  features?: string[];
  firstObserved?: string;
  glyphs?: string;

  // Cardinal coordinates
  coordGeometry?: number;
  coordAlterity?: number;
  coordDynamics?: number;

  // Extended classification
  extended?: ExtendedClassification;

  // Connections to other entities
  suggestedConnections?: string[];
}

/**
 * An Archivist cataloguing session
 * Tracks the conversation and extracted fields
 */
export interface ArchivistSession {
  id: string;
  userId: string;
  startedAt: string;
  lastActivityAt: string;
  status: 'active' | 'completed' | 'abandoned';

  // Media that initiated this session
  initialMedia?: MediaAnalysis;

  // Conversation history
  messages: ArchivistMessage[];

  // Extracted fields so far
  extractedFields: ExtractedFields;

  // Confidence in current classification (0-1)
  confidence: number;

  // Warnings about conflicts or issues
  warnings: string[];
}

export interface ArchivistMessage {
  role: 'user' | 'archivist';
  content: string;
  timestamp: string;

  // Fields extracted from this exchange
  extractedFields?: Partial<ExtractedFields>;
}

/**
 * Response from the Archivist after a user message
 */
export interface ArchivistResponse {
  message: string;  // The Archivist's response
  extractedFields: Partial<ExtractedFields>;  // New fields identified in this exchange
  confidence: number;  // Overall confidence in classification (0-1)
  suggestedQuestions?: string[];  // Follow-up questions for the user
  warnings?: string[];  // Potential conflicts with existing lore
  isComplete?: boolean;  // Whether enough info has been gathered
}

/**
 * Validation result for extracted fields
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  confidence: number;
}
