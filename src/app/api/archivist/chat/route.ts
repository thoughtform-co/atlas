import { NextRequest, NextResponse } from 'next/server';
import { archivist } from '@/lib/archivist/archivist';
import type { MediaAnalysis } from '@/lib/archivist/types';
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
 *   userId?: string,           // User identifier (optional - will use auth user if available)
 *   imageUrl?: string,         // Optional image URL for analysis
 *   mediaAnalysis?: {          // Optional media analysis for new sessions
 *     mediaUrl?: string,
 *     mediaType?: 'image' | 'video',
 *     visualDescription?: string,
 *     mood?: string,
 *     suggestedName?: string,
 *     suggestedType?: string
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
    const { sessionId, message, userId: providedUserId, mediaAnalysis, imageUrl } = body;

    // Get authenticated user if available, otherwise use provided userId
    const authUser = await getAuthUser();
    const userId = authUser?.id || providedUserId;

    // Validate request
    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'Authentication required or userId must be provided' },
        { status: 401 }
      );
    }

    // Start new session
    if (!sessionId) {
      const session = await archivist.startSession(userId, mediaAnalysis as MediaAnalysis);

      return NextResponse.json({
        sessionId: session.id,
        message: session.messages[0].content,
        extractedFields: {},
        confidence: 0,
        isComplete: false,
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

    // Pass image URL to chat if provided
    const response = await archivist.chat(sessionId, message, imageUrl);

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
 * // Start new session
 * const newSession = await fetch('/api/archivist/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     userId: 'user-123',
 *     mediaAnalysis: {
 *       visualDescription: 'A spectral figure at a threshold',
 *       mood: 'liminal, uncertain'
 *     }
 *   })
 * }).then(r => r.json());
 *
 * console.log(newSession.message); // Archivist's greeting
 *
 * // Continue conversation
 * const response = await fetch('/api/archivist/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     sessionId: newSession.sessionId,
 *     message: 'It guards the threshold between dreams and waking'
 *   })
 * }).then(r => r.json());
 *
 * console.log(response.message); // Archivist's response
 * console.log(response.extractedFields); // { type: 'Guardian', domain: 'Dream Threshold', ... }
 * console.log(response.confidence); // 0.65
 */
