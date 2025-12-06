import { Navigation } from '@/components/ui/Navigation';
import { ConstellationView } from '@/components/constellation';
import { fetchDenizens, fetchConnections } from '@/lib/data';

// Always render dynamically so freshly uploaded media appear after refresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [denizens, connections] = await Promise.all([
    fetchDenizens(),
    fetchConnections(),
  ]);

  return (
    <main>
      <Navigation />
      <ConstellationView denizens={denizens} connections={connections} />
    </main>
  );
}
