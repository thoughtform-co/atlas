import { Navigation } from '@/components/ui/Navigation';
import { ConstellationView } from '@/components/constellation';
import { fetchDenizens, fetchConnections } from '@/lib/data';

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
