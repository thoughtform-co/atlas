import { NextRequest, NextResponse } from 'next/server';
import { archivist } from '@/lib/archivist/archivist';
import type { MediaAnalysis, SessionEntityContext } from '@/lib/archivist/types';
import { getAuthUser } from '@/lib/supabase-server';

/**
 * POST /api/archivist/chat
 *
 * Send a message to the Archivist and receive a response
 *
 * Request body:
 * {
 *   sessionId?: string,        // Existing session ID (omit to start new session)
 *   message?: string,          // User message (omit for new session)
 *   entityId?: string,         // Entity ID for session resumption (new sessions)
 *   imageUrl?: string,         // Optional image URL for analysis
 *   mediaAnalysis?: {          // Optional media analysis for new sessions
 *     mediaUrl?: string,
 *     mediaType?: 'image' | 'video',
 *     visualDescription?: string,
 *     mood?: string,
 *     suggestedName?: string,
 *     suggestedType?: string
 *   },
 *   entityContext?: {          // Entity context for Claude (includes MJ prompt, Gemini analysis, etc.)
 *     name?: string,
 *     domain?: string,
 *     type?: string,
 *     description?: string,
 *     midjourneyPrompt?: string,
 *     mediaUrl?: string,
 *     geminiAnalysis?: object,
 *     allFields?: object
 *   }
 * }
 *
 * Response:
 * {
 *   sessionId: string,
 *   message: string,                 // Archivist's response
 *   extractedFields: object,         // Fields extracted from this exchange
 *   confidence: number,              // Overall classification confidence (0-1)
 *   suggestedQuestions?: string[],   // Follow-up questions
 *   warnings?: string[],             // Conflicts or concerns
 *   isComplete?: boolean,            // Whether enough info has been gathered
 *   toolsUsed?: Array<{              // Tools invoked during this response
 *     name: string,
 *     success: boolean,
 *     error?: string
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, mediaAnalysis, imageUrl, entityId, entityContext } = body;

    // Get authenticated user from cookies
    const authUser = await getAuthUser();
    const userId = authUser?.id;

    // Validate request - require authentication for new sessions
    if (!sessionId && !userId) {
      console.log('[archivist/chat] No session and no authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Start new session or resume existing one for entity
    if (!sessionId) {
      console.log('[archivist/chat] Starting/resuming session for user:', userId, 'entity:', entityId);
      
      let session;
      if (entityId) {
        // Use getOrCreateSessionForEntity to resume existing session if available
        session = await archivist.getOrCreateSessionForEntity(
          userId!,
          entityId,
          entityContext as SessionEntityContext,
          mediaAnalysis as MediaAnalysis
        );
      } else {
        // No entity ID - create new standalone session
        session = await archivist.startSession(
          userId!,
          mediaAnalysis as MediaAnalysis,
          undefined,
          entityContext as SessionEntityContext
        );
      }

      // Return all messages when resuming, or just the greeting for new sessions
      const isResumed = session.messages.length > 1;
      
      return NextResponse.json({
        sessionId: session.id,
        message: session.messages[session.messages.length - 1].content,
        // Include all messages when resuming so chat history is preserved
        messages: isResumed ? session.messages : undefined,
        extractedFields: session.extractedFields || {},
        confidence: session.confidence || 0,
        isComplete: false,
        isResumed,
      });
    }

    // Continue existing session
    if (!message) {
      return NextResponse.json({ error: 'message is required for existing sessions' }, {
        status: 400,
      });
    }

    // Validate session ownership if user is authenticated
    if (userId) {
      const session = await archivist.getSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (session.userId && session.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Pass image URL and entity context to chat
    const response = await archivist.chat(
      sessionId, 
      message, 
      imageUrl,
      entityContext as SessionEntityContext
    );

    // Format tool usage for response (simplified for UI)
    const toolsUsed = response.toolsUsed?.map(tool => ({
      name: tool.name,
      success: tool.success,
      error: tool.error,
      durationMs: tool.endTime && tool.startTime ? tool.endTime - tool.startTime : undefined,
    }));

    return NextResponse.json({
      sessionId,
      message: response.message,
      extractedFields: response.extractedFields,
      confidence: response.confidence,
      suggestedQuestions: response.suggestedQuestions,
      warnings: response.warnings,
      isComplete: response.isComplete,
      toolsUsed,
    });
  } catch (error) {
    console.error('Archivist chat error:', error);

    if (error instanceof Error) {
      if (error.message === 'Session not found') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (error.message === 'Session is not active') {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Example usage from client:
 *
 * // Start or resume session for an entity (with full context)
 * const session = await fetch('/api/archivist/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     entityId: 'nullbringer-abc123',  // Will resume existing session if one exists
 *     entityContext: {
 *       name: 'Nullbringer',
 *       domain: 'Starhaven Reaches',
 *       midjourneyPrompt: 'cosmic entity golden throne --sref 1942457994',
 *       mediaUrl: 'https://storage.example.com/media/entity.mp4',
 *       geminiAnalysis: { ... },  // Pre-analyzed by Gemini
 *       allFields: { ... }  // All form fields
 *     }
 *   })
 * }).then(r => r.json());
 *
 * console.log(session.message); // Archivist's greeting (or last message if resumed)
 * console.log(session.isResumed); // true if session was resumed
 *
 * // Continue conversation (with updated context)
 * const response = await fetch('/api/archivist/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     sessionId: session.sessionId,
 *     message: 'Tell me about connections to other entities',
 *     entityContext: { ... }  // Can update context with latest form data
 *   })
 * }).then(r => r.json());
 *
 * console.log(response.message); // Archivist's response (with full context awareness)
 */
