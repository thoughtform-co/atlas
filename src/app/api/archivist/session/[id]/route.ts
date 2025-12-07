import { NextRequest, NextResponse } from 'next/server';
import { archivist } from '@/lib/archivist/archivist';

/**
 * GET /api/archivist/session/[id]
 *
 * Get session state and extracted fields
 *
 * Response:
 * {
 *   id: string,
 *   userId: string,
 *   startedAt: string,
 *   lastActivityAt: string,
 *   status: 'active' | 'completed' | 'abandoned',
 *   messages: ArchivistMessage[],
 *   extractedFields: ExtractedFields,
 *   confidence: number,
 *   warnings: string[]
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await archivist.getSession(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/archivist/session/[id]
 *
 * Commit session to archive (create the denizen)
 *
 * Response:
 * {
 *   success: true,
 *   denizen: Partial<Denizen>
 * }
 *
 * Or error:
 * {
 *   error: string,
 *   missingFields?: string[]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const denizen = await archivist.commitToArchive(id);

    return NextResponse.json({
      success: true,
      denizen,
    });
  } catch (error) {
    console.error('Commit to archive error:', error);

    if (error instanceof Error) {
      if (error.message === 'Session not found') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (error.message.includes('missing required fields')) {
        // Extract missing fields from error message
        const match = error.message.match(/missing required fields: (.+)/);
        const missingFields = match ? match[1].split(', ') : [];

        return NextResponse.json(
          {
            error: 'Cannot commit to archive - missing required fields',
            missingFields,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/archivist/session/[id]
 *
 * Abandon session without creating entity
 *
 * Response:
 * {
 *   success: true
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await archivist.abandonSession(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Abandon session error:', error);

    if (error instanceof Error) {
      if (error.message === 'Session not found') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Example usage from client:
 *
 * // Get session state
 * const session = await fetch('/api/archivist/session/abc-123')
 *   .then(r => r.json());
 *
 * console.log(session.extractedFields);
 * console.log(session.confidence);
 *
 * // Commit to archive
 * const result = await fetch('/api/archivist/session/abc-123', {
 *   method: 'POST'
 * }).then(r => r.json());
 *
 * if (result.success) {
 *   console.log('Entity created:', result.denizen);
 *   // Now save denizen to database with media, position, etc.
 * } else {
 *   console.error('Missing fields:', result.missingFields);
 * }
 *
 * // Abandon session
 * await fetch('/api/archivist/session/abc-123', {
 *   method: 'DELETE'
 * });
 */
