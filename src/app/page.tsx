import { Navigation } from '@/components/ui/Navigation';
import { ConstellationView } from '@/components/constellation';

export default function Home() {
  return (
    <main>
      <Navigation />
      <ConstellationView />
    </main>
  );
}
