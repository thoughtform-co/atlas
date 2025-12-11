import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/revalidate
 * Revalidate a specific path to refresh server-rendered content
 * 
 * Body: { path: string }
 */
export async function POST(request: NextRequest) {
  try {
    // #region agent log
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    const logEntry1 = JSON.stringify({location:'api/revalidate/route.ts:14',message:'Revalidate API called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})+'\n';
    try { fs.appendFileSync(logPath, logEntry1); } catch {}
    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:logEntry1.trim()}).catch(()=>{});
    // #endregion
    const { path } = await request.json();

    if (!path || typeof path !== 'string') {
      // #region agent log
      const fs = require('fs');
      const pathModule = require('path');
      const logPath = pathModule.join(process.cwd(), '.cursor', 'debug.log');
      const logEntry2 = JSON.stringify({location:'api/revalidate/route.ts:20',message:'Revalidate API invalid path',data:{path},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})+'\n';
      try { fs.appendFileSync(logPath, logEntry2); } catch {}
      fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:logEntry2.trim()}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // #region agent log
    const fs = require('fs');
    const pathModule = require('path');
    const logPath = pathModule.join(process.cwd(), '.cursor', 'debug.log');
    const logEntry3 = JSON.stringify({location:'api/revalidate/route.ts:26',message:'Calling revalidatePath',data:{path},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})+'\n';
    try { fs.appendFileSync(logPath, logEntry3); } catch {}
    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:logEntry3.trim()}).catch(()=>{});
    // #endregion
    // Revalidate the specified path
    revalidatePath(path);
    // #region agent log
    const logEntry4 = JSON.stringify({location:'api/revalidate/route.ts:29',message:'revalidatePath completed',data:{path},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})+'\n';
    try { fs.appendFileSync(logPath, logEntry4); } catch {}
    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:logEntry4.trim()}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      success: true,
      message: `Path ${path} revalidated`,
      revalidated: true,
      now: Date.now(),
    });
  } catch (error) {
    // #region agent log
    const fs = require('fs');
    const pathModule = require('path');
    const logPath = pathModule.join(process.cwd(), '.cursor', 'debug.log');
    const logEntry5 = JSON.stringify({location:'api/revalidate/route.ts:40',message:'Revalidate API error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})+'\n';
    try { fs.appendFileSync(logPath, logEntry5); } catch {}
    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:logEntry5.trim()}).catch(()=>{});
    // #endregion
    console.error('[revalidate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to revalidate path',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
