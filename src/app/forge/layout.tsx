'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './forge.module.css';
import { ForgeSidebar } from '@/components/forge/ForgeSidebar';
import { ForgeCostTicker } from '@/components/forge/ForgeCostTicker';

interface ForgeLayoutProps {
  children: React.ReactNode;
}

export default function ForgeLayout({ children }: ForgeLayoutProps) {
  const pathname = usePathname();
  
  // Determine active tab
  const isVideoTab = pathname === '/forge' || pathname.startsWith('/forge/');
  const isEditTab = false; // Placeholder for future Edit tab

  return (
    <div className={styles.forgeContainer}>
      {/* HUD Corners */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* HUD Rails */}
      <div className="hud-rail hud-rail-left">
        <div className="rail-scale">
          <div className="scale-ticks">
            {[...Array(11)].map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? 'tick-major' : 'tick-minor'}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="hud-rail hud-rail-right">
        <div className="rail-scale">
          <div className="scale-ticks">
            {[...Array(11)].map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? 'tick-major' : 'tick-minor'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Cost Ticker in top-right area */}
      <ForgeCostTicker />

      {/* Tab Navigation */}
      <div className={styles.tabBar}>
        <Link 
          href="/forge" 
          className={`${styles.tab} ${isVideoTab ? styles.tabActive : ''}`}
        >
          VIDEO
        </Link>
        <div className={`${styles.tab} ${styles.tabDisabled} ${isEditTab ? styles.tabActive : ''}`}>
          EDIT
          <span className={styles.tabBadge}>SOON</span>
        </div>
      </div>

      {/* Session Sidebar */}
      <ForgeSidebar />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
