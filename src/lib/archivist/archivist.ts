import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import type {
  ArchivistSession,
  ArchivistResponse,
  ArchivistMessage,
  MediaAnalysis,
  ExtractedFields,
} from './types';
import type { Denizen } from '@/lib/types';
import {
  ARCHIVIST_SYSTEM_PROMPT,
  ARCHIVIST_OPENING_WITH_MEDIA,
  ARCHIVIST_OPENING_WITHOUT_MEDIA,
} from './system-prompt';
import {
  extractFieldsFromResponse,
  mergeFields,
  validateFields,
  calculateConfidence,
  generateSuggestedQuestions,
} from './field-extraction';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * In-memory session storage
 * In production, this would be replaced with a database
 */
const sessions = new Map<string, ArchivistSession>();

/**
 * The Archivist - AI cataloguer for liminal entities
 *
 * Example usage:
 * ```
 * const archivist = new Archivist();
 *
 * // Start new session
 * const session = await archivist.startSession('user-123', mediaAnalysis);
 * console.log(session.messages[0].content); // Archivist's opening
 *
 * // Continue conversation
 * const response = await archivist.chat(session.id, "It guards the threshold between dreams and waking");
 *
 * // Check extracted fields
 * const fields = await archivist.getExtractedFields(session.id);
 *
 * // When ready, commit to archive
 * const denizen = await archivist.commitToArchive(session.id);
 * ```
 */
export class Archivist {
  /**
   * Start a new cataloguing session
   * The Archivist will provide an initial greeting based on any media provided
   */
  async startSession(userId: string, initialMedia?: MediaAnalysis): Promise<ArchivistSession> {
    const sessionId = randomUUID();

    // Generate opening message
    let openingMessage: string;
    if (initialMedia?.visualDescription) {
      const mediaDesc = `The visual resonance reveals: ${initialMedia.visualDescription}${
        initialMedia.mood ? `. The ambient signature suggests: ${initialMedia.mood}.` : ''
      }`;
      openingMessage = ARCHIVIST_OPENING_WITH_MEDIA(mediaDesc);
    } else {
      openingMessage = ARCHIVIST_OPENING_WITHOUT_MEDIA;
    }

    // Initialize session
    const session: ArchivistSession = {
      id: sessionId,
      userId,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      initialMedia,
      messages: [
        {
          role: 'archivist',
          content: openingMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      extractedFields: {},
      confidence: 0,
      warnings: [],
    };

    // Store session
    sessions.set(sessionId, session);

    return session;
  }

  /**
   * Continue conversation with the Archivist
   * Sends user message and receives Archivist response with extracted fields
   */
  async chat(sessionId: string, userMessage: string): Promise<ArchivistResponse> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    // Add user message to history
    const userMsg: ArchivistMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    // Build conversation history for Claude
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role === 'archivist' ? ('assistant' as const) : ('user' as const),
      content: msg.content,
    }));

    // Call Claude with Archivist personality
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7, // Higher temperature for more character personality
      system: ARCHIVIST_SYSTEM_PROMPT,
      messages: conversationHistory,
    });

    const archivistMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract fields from this exchange
    const conversationContext = session.messages
      .slice(-4, -1) // Last few messages for context
      .map((m) => `${m.role === 'user' ? 'User' : 'Archivist'}: ${m.content}`)
      .join('\n\n');

    const extractedFields = await extractFieldsFromResponse(
      userMessage,
      archivistMessage,
      conversationContext
    );

    // Merge with existing fields
    session.extractedFields = mergeFields(session.extractedFields, extractedFields);

    // Validate and calculate confidence
    const validation = validateFields(session.extractedFields);
    session.confidence = validation.confidence;

    // Check for conflicts with existing lore (placeholder - would query database)
    const warnings = await this.checkForConflicts(session.extractedFields);
    session.warnings = [...session.warnings, ...warnings];

    // Generate suggested questions
    const suggestedQuestions = generateSuggestedQuestions(session.extractedFields);

    // Determine if cataloguing is complete
    const isComplete = validation.valid && session.confidence > 0.7;

    // Add archivist message to history
    const archivistMsg: ArchivistMessage = {
      role: 'archivist',
      content: archivistMessage,
      timestamp: new Date().toISOString(),
      extractedFields,
    };
    session.messages.push(archivistMsg);

    // Update session
    session.lastActivityAt = new Date().toISOString();
    sessions.set(sessionId, session);

    // Return response
    return {
      message: archivistMessage,
      extractedFields,
      confidence: session.confidence,
      suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      isComplete,
    };
  }

  /**
   * Get current extracted fields from session
   */
  async getExtractedFields(sessionId: string): Promise<ExtractedFields> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.extractedFields;
  }

  /**
   * Get full session state
   */
  async getSession(sessionId: string): Promise<ArchivistSession | null> {
    return sessions.get(sessionId) || null;
  }

  /**
   * Finalize and create the denizen entity
   * Validates that all required fields are present
   */
  async commitToArchive(sessionId: string): Promise<Partial<Denizen>> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate fields
    const validation = validateFields(session.extractedFields);
    if (!validation.valid) {
      throw new Error(
        `Cannot commit to archive - missing required fields: ${validation.missingRequired.join(', ')}`
      );
    }

    const fields = session.extractedFields;

    // Generate ID from name
    const id = fields.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Build denizen object
    // Note: This returns a partial denizen - the caller must handle:
    // - Position assignment (x, y)
    // - Connection IDs (convert names to IDs)
    // - Media attachment
    // - Database insertion
    const denizen: Partial<Denizen> = {
      id,
      name: fields.name!,
      subtitle: fields.subtitle,
      type: fields.type!,
      allegiance: fields.allegiance!,
      threatLevel: fields.threatLevel!,
      domain: fields.domain!,
      description: fields.description!,
      lore: fields.lore,
      features: fields.features,
      firstObserved: fields.firstObserved,
      glyphs: fields.glyphs || '◈○⬡∆', // Default glyphs
      coordinates: {
        geometry: fields.coordGeometry ?? 0,
        alterity: fields.coordAlterity ?? 0,
        dynamics: fields.coordDynamics ?? 0,
      },
      connections: [], // Will be populated by caller based on suggestedConnections
    };

    // Mark session as completed
    session.status = 'completed';
    sessions.set(sessionId, session);

    return denizen;
  }

  /**
   * Abandon session without creating entity
   */
  async abandonSession(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'abandoned';
    sessions.set(sessionId, session);
  }

  /**
   * Check for conflicts with existing entities
   * Placeholder implementation - in production would query database
   */
  private async checkForConflicts(fields: ExtractedFields): Promise<string[]> {
    const warnings: string[] = [];

    // Example conflict checks:
    // - Similar names
    // - Overlapping domains
    // - Contradictory lore references
    // - Duplicate coordinates

    // TODO: Implement actual conflict checking against database
    // For now, return empty array

    return warnings;
  }

  /**
   * Clean up old abandoned sessions (maintenance)
   */
  static cleanupOldSessions(maxAgeHours: number = 24): number {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    let cleaned = 0;

    const idsToDelete: string[] = [];
    sessions.forEach((session, id) => {
      const lastActivity = new Date(session.lastActivityAt).getTime();
      if (
        (session.status === 'abandoned' || session.status === 'completed') &&
        lastActivity < cutoff
      ) {
        idsToDelete.push(id);
      }
    });

    idsToDelete.forEach(id => {
      sessions.delete(id);
      cleaned++;
    });

    return cleaned;
  }
}

// Export singleton instance
export const archivist = new Archivist();
