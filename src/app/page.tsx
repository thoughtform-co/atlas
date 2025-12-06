import { Navigation } from '@/components/ui/Navigation';
import { ConstellationView } from '@/components/constellation';
import { fetchDenizens, fetchConnections, checkDatabaseHealth } from '@/lib/data';
import { denizens as staticDenizens, connections as staticConnections } from '@/data/denizens';

// Always render dynamically so freshly uploaded media appear after refresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let denizens = staticDenizens;
  let connections = staticConnections;
  let databaseError: string | null = null;

  try {
    // Check database health first
    const health = await checkDatabaseHealth();
    
    if (health.overall === 'unavailable') {
      console.warn('[Home] Database unavailable, using static data:', health.errors);
      databaseError = `Database unavailable: ${health.errors.join('; ')}`;
    } else if (health.overall === 'degraded') {
      console.warn('[Home] Database degraded, some tables may be unavailable:', health.errors);
      databaseError = `Database degraded: ${health.errors.join('; ')}`;
    }

    // Try to fetch from database
    try {
      const [fetchedDenizens, fetchedConnections] = await Promise.all([
        fetchDenizens(),
        fetchConnections(),
      ]);
      denizens = fetchedDenizens;
      connections = fetchedConnections;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Home] Error fetching data, falling back to static:', errorMsg);
      databaseError = `Failed to fetch data: ${errorMsg}`;
      // Use static data as fallback
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Home] Fatal error, using static data:', errorMsg);
    databaseError = `Fatal error: ${errorMsg}`;
  }

  return (
    <main>
      <Navigation />
      {databaseError && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '12px 20px',
            background: 'rgba(193, 127, 89, 0.9)',
            border: '1px solid rgba(236, 227, 214, 0.3)',
            color: '#ECE3D6',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          <strong>Database Error:</strong> {databaseError}
          <br />
          <span style={{ opacity: 0.8, fontSize: '9px' }}>
            Using static data. Check console for details.
          </span>
        </div>
      )}
      <ConstellationView denizens={denizens} connections={connections} />
    </main>
  );
}
