'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './forge.module.css';
import { ForgeSidebar } from '@/components/forge/ForgeSidebar';
import { ForgeCostTicker } from '@/components/forge/ForgeCostTicker';

interface ForgeLayoutProps {
  children: React.ReactNode;
}

export default function ForgeLayout({ children }: ForgeLayoutProps) {
  const pathname = usePathname();
  const rightRailRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  
  // Determine active tab
  const isVideoTab = pathname === '/forge' || pathname.startsWith('/forge/');
  const isEditTab = false; // Placeholder for future Edit tab

  // Update energy beam position based on scroll
  const updateScrollBeam = useCallback(() => {
    const mainContent = mainContentRef.current;
    const rightRail = rightRailRef.current;
    
    if (!mainContent || !rightRail) return;
    
    const scrollTop = mainContent.scrollTop;
    const scrollHeight = mainContent.scrollHeight - mainContent.clientHeight;
    const hasScroll = scrollHeight > 0;
    
    if (hasScroll) {
      // Calculate scroll percentage (0-100)
      const scrollPercent = (scrollTop / scrollHeight) * 100;
      // Account for beam height (60px) so it stays within the rail
      const railHeight = rightRail.offsetHeight;
      const beamHeight = 60;
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
    };
  }, [updateScrollBeam]);

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
      <div className="hud-rail hud-rail-right" ref={rightRailRef}>
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
      <main className={styles.mainContent} ref={mainContentRef}>
        {children}
      </main>
    </div>
  );
}
