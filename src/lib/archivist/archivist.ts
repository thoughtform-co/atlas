import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
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
 * Create Supabase client with service role for server-side operations
 * This bypasses RLS to allow the Archivist to manage sessions
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured for Archivist');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

/**
 * Convert database row to ArchivistSession
 */
function dbRowToSession(row: Database['public']['Tables']['archivist_sessions']['Row']): ArchivistSession {
  const messages = (row.messages as unknown as ArchivistMessage[]) || [];
  const extractedFields = (row.extracted_fields as unknown as ExtractedFields) || {};
  const initialMedia = (row.video_analysis as unknown as MediaAnalysis | null) || undefined;

  // Calculate confidence from extracted fields
  const validation = validateFields(extractedFields);
  const confidence = validation.confidence;

  // Extract warnings from extracted_fields metadata or compute from validation
  const warnings: string[] = validation.warnings || [];

  // Map status: 'in_progress' -> 'active'
  const status = row.status === 'in_progress' ? 'active' : row.status;

  return {
    id: row.id,
    userId: row.user_id || '',
    startedAt: row.created_at,
    lastActivityAt: row.updated_at,
    status: status as 'active' | 'completed' | 'abandoned',
    initialMedia,
    messages,
    extractedFields,
    confidence,
    warnings,
  };
}

/**
 * Convert ArchivistSession to database insert/update format
 */
function sessionToDbRow(session: ArchivistSession): {
  id: string;
  user_id: string | null;
  messages: unknown;
  extracted_fields: unknown;
  video_analysis: unknown;
  status: 'in_progress' | 'completed' | 'abandoned';
} {
  // Map status: 'active' -> 'in_progress'
  const dbStatus = session.status === 'active' ? 'in_progress' : session.status;

  return {
    id: session.id,
    user_id: session.userId || null,
    messages: session.messages as unknown,
    extracted_fields: session.extractedFields as unknown,
    video_analysis: (session.initialMedia || null) as unknown,
    status: dbStatus,
  };
}

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
    const supabase = getSupabaseClient();

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

    // Store session in database
    const dbRow = sessionToDbRow(session);
    const { error } = await (supabase as any)
      .from('archivist_sessions')
      .insert(dbRow);

    if (error) {
      console.error('[Archivist] Error creating session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return session;
  }

  /**
   * Continue conversation with the Archivist
   * Sends user message and receives Archivist response with extracted fields
   */
  async chat(sessionId: string, userMessage: string): Promise<ArchivistResponse> {
    const supabase = getSupabaseClient();

    // Load session from database
    const { data: row, error: fetchError } = await (supabase as any)
      .from('archivist_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !row) {
      throw new Error('Session not found');
    }

    const session = dbRowToSession(row);

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

    // Update session in database
    session.lastActivityAt = new Date().toISOString();
    const dbRow = sessionToDbRow(session);
    
    const { error: updateError } = await (supabase as any)
      .from('archivist_sessions')
      .update({
        messages: dbRow.messages,
        extracted_fields: dbRow.extracted_fields,
        status: dbRow.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[Archivist] Error updating session:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

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
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.extractedFields;
  }

  /**
   * Get full session state
   */
  async getSession(sessionId: string): Promise<ArchivistSession | null> {
    const supabase = getSupabaseClient();

    const { data: row, error } = await (supabase as any)
      .from('archivist_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !row) {
      return null;
    }

    return dbRowToSession(row);
  }

  /**
   * Finalize and create the denizen entity
   * Validates that all required fields are present
   */
  async commitToArchive(sessionId: string): Promise<Partial<Denizen>> {
    const supabase = getSupabaseClient();

    // Load session from database
    const { data: row, error: fetchError } = await (supabase as any)
      .from('archivist_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !row) {
      throw new Error('Session not found');
    }

    const session = dbRowToSession(row);

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

    // Mark session as completed in database
    session.status = 'completed';
    const { error: updateError } = await (supabase as any)
      .from('archivist_sessions')
      .update({
        status: 'completed',
        denizen_id: id, // Link session to created denizen
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[Archivist] Error completing session:', updateError);
      throw new Error(`Failed to complete session: ${updateError.message}`);
    }

    return denizen;
  }

  /**
   * Abandon session without creating entity
   */
  async abandonSession(sessionId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await (supabase as any)
      .from('archivist_sessions')
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[Archivist] Error abandoning session:', error);
      throw new Error(`Failed to abandon session: ${error.message}`);
    }
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
   * Can be called from a cron job or scheduled task
   */
  static async cleanupOldSessions(maxAgeHours: number = 24): Promise<number> {
    const supabase = getSupabaseClient();
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    // Delete old abandoned or completed sessions
    const { data, error } = await (supabase as any)
      .from('archivist_sessions')
      .delete()
      .in('status', ['abandoned', 'completed'])
      .lt('updated_at', cutoff)
      .select('id');

    if (error) {
      console.error('[Archivist] Error cleaning up old sessions:', error);
      return 0;
    }

    return data?.length || 0;
  }
}

// Export singleton instance
export const archivist = new Archivist();
