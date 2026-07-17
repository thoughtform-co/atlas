'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './forge.module.css';
import { ForgeSidebar } from '@/components/forge/ForgeSidebar';
import { ForgeCostTicker } from '@/components/forge/ForgeCostTicker';
import { SigilLab } from '@/components/forge/SigilLab';

interface ForgeLayoutProps {
  children: React.ReactNode;
}

export default function ForgeLayout({ children }: ForgeLayoutProps) {
  const pathname = usePathname();
  const mainContentRef = useRef<HTMLElement>(null);
  const [showSigilLab, setShowSigilLab] = useState(false);
  
  // Determine active tab
  const isVideoTab = !showSigilLab && (pathname === '/forge' || pathname.startsWith('/forge/'));
  const isEditTab = false; // Placeholder for future Edit tab
  const isSigilsTab = showSigilLab;

  // Update energy beam position based on scroll. The right rail now lives in
  // the global HudChrome layer, so query it from the DOM. It's hidden ≤960px
  // (offsetHeight 0), so guard against that to avoid a divide-by-zero.
  const updateScrollBeam = useCallback(() => {
    const mainContent = mainContentRef.current;
    const rightRail = document.querySelector<HTMLElement>('.hud__rail--r');

    if (!mainContent || !rightRail) return;

    const scrollTop = mainContent.scrollTop;
    const scrollHeight = mainContent.scrollHeight - mainContent.clientHeight;
    const railHeight = rightRail.offsetHeight;
    const hasScroll = scrollHeight > 0 && railHeight > 0;

    if (hasScroll) {
      // Calculate scroll percentage (0-100)
      const scrollPercent = (scrollTop / scrollHeight) * 100;
      // Account for beam height (120px) so it stays within the rail
      const beamHeight = 120;
      const maxPosition = ((railHeight - beamHeight) / railHeight) * 100;
      const beamPosition = (scrollPercent / 100) * maxPosition;

      rightRail.style.setProperty('--scroll-beam-position', `${beamPosition}%`);
      rightRail.classList.add('has-scroll');
    } else {
      rightRail.classList.remove('has-scroll');
      rightRail.style.setProperty('--scroll-beam-position', '0%');
    }
  }, []);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;
    
    // Initial update
    updateScrollBeam();
    
    // Listen for scroll events
    mainContent.addEventListener('scroll', updateScrollBeam, { passive: true });
    
    // Also listen for content changes (e.g., when videos load)
    const resizeObserver = new ResizeObserver(updateScrollBeam);
    resizeObserver.observe(mainContent);
    
    return () => {
      mainContent.removeEventListener('scroll', updateScrollBeam);
      resizeObserver.disconnect();
      // Clear the beam state off the global rail when leaving Forge.
      document.querySelector('.hud__rail--r')?.classList.remove('has-scroll');
    };
  }, [updateScrollBeam]);

  return (
    <div className={styles.forgeContainer}>
      {/* Corners + rails now come from the global HudChrome layer; the energy
          beam is painted onto the global right rail via updateScrollBeam. */}

      {/* Cost Ticker in top-right area (below the hamburger nav) */}
      <ForgeCostTicker />

      {/* Tab Navigation */}
      <div className={styles.tabBar}>
        <Link 
          href="/forge" 
          className={`${styles.tab} ${isVideoTab ? styles.tabActive : ''}`}
          onClick={() => setShowSigilLab(false)}
        >
          VIDEO
        </Link>
        <div className={`${styles.tab} ${styles.tabDisabled} ${isEditTab ? styles.tabActive : ''}`}>
          EDIT
          <span className={styles.tabBadge}>SOON</span>
        </div>
        <button 
          className={`${styles.tab} ${isSigilsTab ? styles.tabActive : ''}`}
          onClick={() => setShowSigilLab(true)}
        >
          SIGILS
        </button>
      </div>

      {/* Session Sidebar */}
      <ForgeSidebar />

      {/* Main Content Area */}
      <main className={styles.mainContent} ref={mainContentRef}>
        {children}
      </main>

      {/* Sigil Lab Modal */}
      {showSigilLab && (
        <SigilLab onClose={() => setShowSigilLab(false)} />
      )}
    </div>
  );
}
