'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Position, Domain } from '@/lib/types';
import { BackgroundCanvas } from '@/components/constellation/BackgroundCanvas';
import { EntityCard } from '@/components/constellation/EntityCard';
import { NavigationHUD, FilterState } from '@/components/constellation/NavigationHUD';
import { clamp } from '@/lib/utils';
import { CONSTELLATION } from '@/lib/constants';
import styles from './celestial.module.css';

// Use static data for mockup
import { denizens as staticDenizens } from '@/data/denizens';

/**
 * CELESTIAL CONSTELLATION MOCKUP
 * 
 * Uses the EXACT same EntityCard component and clustering logic as the main view,
 * but adds 3D rotation to cards orbiting around their domain center.
 */

interface Card3DWrapperProps {
  children: React.ReactNode;
  rotationAngle: number;
  phiOffset: number;
  style?: React.CSSProperties;
}

/**
 * 3D wrapper that adds rotation to the standard EntityCard
 */
function Card3DWrapper({ children, rotationAngle, phiOffset, style }: Card3DWrapperProps) {
  // Calculate 3D rotation based on orbit position
  const phi = rotationAngle + phiOffset;
  
  // Card faces outward, rotates around Y axis
  const rotationY = Math.sin(phi) * 45; // Rotate between -45 and +45 degrees
  const rotationX = Math.cos(phi) * 10; // Slight tilt
  
  // Depth effect - cards "behind" are slightly smaller/dimmer
  const depthFactor = (Math.cos(phi) + 1) / 2; // 0 to 1
  const cardScale = 0.85 + depthFactor * 0.15;
  const cardOpacity = 0.7 + depthFactor * 0.3;
  const zIndex = Math.floor(10 + depthFactor * 20);

  return (
    <div
      className={styles.card3dWrapper}
      style={{
        ...style,
        zIndex,
        opacity: cardOpacity,
      }}
    >
      <div
        className={styles.card3dInner}
        style={{
          transform: `
            perspective(800px)
            rotateY(${rotationY}deg)
            rotateX(${rotationX}deg)
            scale(${cardScale})
          `,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function CelestialConstellationPage() {
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.6);
  const [isDragging, setIsDragging] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    domains: new Set(),
    entityTypes: new Set(),
    allegiances: new Set(),
  });
  const lastMouseRef = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Use static data
  const denizens = staticDenizens;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter denizens (same as main constellation)
  const filteredDenizens = useMemo(() => {
    const hasDomainFilter = filters.domains.size > 0;
    const hasTypeFilter = filters.entityTypes.size > 0;
    const hasAllegianceFilter = filters.allegiances.size > 0;

    if (!hasDomainFilter && !hasTypeFilter && !hasAllegianceFilter) {
      return denizens;
    }

    return denizens.filter(denizen => {
      if (hasDomainFilter && !filters.domains.has(denizen.domain || 'default')) return false;
      if (hasTypeFilter && !filters.entityTypes.has(denizen.type)) return false;
      if (hasAllegianceFilter && !filters.allegiances.has(denizen.allegiance)) return false;
      return true;
    });
  }, [denizens, filters]);

  /**
   * Calculate clustered positions - SAME LOGIC as main ConstellationView
   */
  const clusteredDenizens = useMemo(() => {
    // Group denizens by domain
    const domainGroups = new Map<string, Denizen[]>();
    filteredDenizens.forEach(d => {
      const domain = d.domain || 'default';
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(d);
    });

    // Calculate initial cluster center for each domain
    const domainCenters = new Map<string, Position>();
    domainGroups.forEach((group, domain) => {
      const avgX = group.reduce((sum, d) => sum + d.position.x, 0) / group.length;
      const avgY = group.reduce((sum, d) => sum + d.position.y, 0) / group.length;
      domainCenters.set(domain, { x: avgX, y: avgY });
    });

    // Apply repulsion between domain centers
    const domains = Array.from(domainCenters.keys());
    if (domains.length > 1) {
      const minSeparation = CONSTELLATION.DOMAIN_MIN_SEPARATION;
      
      for (let iter = 0; iter < CONSTELLATION.DOMAIN_REPULSION_ITERATIONS; iter++) {
        for (let i = 0; i < domains.length; i++) {
          for (let j = i + 1; j < domains.length; j++) {
            const centerA = domainCenters.get(domains[i])!;
            const centerB = domainCenters.get(domains[j])!;
            
            const dx = centerB.x - centerA.x;
            const dy = centerB.y - centerA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minSeparation && distance > 0) {
              const overlap = minSeparation - distance;
              const pushX = (dx / distance) * overlap * 0.5;
              const pushY = (dy / distance) * overlap * 0.5;
              
              domainCenters.set(domains[i], { x: centerA.x - pushX, y: centerA.y - pushY });
              domainCenters.set(domains[j], { x: centerB.x + pushX, y: centerB.y + pushY });
            }
          }
        }
      }
    }

    // Reposition entities within each domain cluster using golden angle spiral
    return filteredDenizens.map((d, globalIdx) => {
      const domain = d.domain || 'default';
      const group = domainGroups.get(domain) || [];
      const center = domainCenters.get(domain)!;
      
      if (group.length <= 1) {
        return { ...d, position: { x: center.x, y: center.y }, phiOffset: 0 };
      }

      const indexInGroup = group.findIndex(g => g.id === d.id);
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angle = indexInGroup * goldenAngle;
      
      const baseRadius = CONSTELLATION.CLUSTER_MIN_SPACING * CONSTELLATION.SPIRAL.BASE_RADIUS_FACTOR;
      const spiralRadius = baseRadius + (indexInGroup * CONSTELLATION.CLUSTER_MIN_SPACING * CONSTELLATION.SPIRAL.GROWTH_FACTOR);
      const radius = Math.min(spiralRadius, CONSTELLATION.CLUSTER_MAX_DISTANCE * CONSTELLATION.SPIRAL.MAX_RADIUS_FACTOR);

      // phiOffset for 3D rotation - each card gets a unique starting angle
      const phiOffset = (indexInGroup / group.length) * Math.PI * 2;

      return {
        ...d,
        position: {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        },
        phiOffset,
      };
    });
  }, [filteredDenizens]);

  // Animation loop for rotation
  useEffect(() => {
    const animate = () => {
      setRotationAngle(prev => prev + 0.003); // Slow rotation
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Auto-center view on mount
  useEffect(() => {
    if (!mounted || clusteredDenizens.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    clusteredDenizens.forEach(d => {
      minX = Math.min(minX, d.position.x);
      maxX = Math.max(maxX, d.position.x);
      minY = Math.min(minY, d.position.y);
      maxY = Math.max(maxY, d.position.y);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    if (typeof window !== 'undefined') {
      setOffset({
        x: window.innerWidth / 2 - centerX * scale,
        y: window.innerHeight / 2 - centerY * scale,
      });
    }
  }, [mounted, clusteredDenizens.length > 0]);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.entity-card')) return;
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => clamp(prev * zoomFactor, 0.2, 2));
  }, []);

  // Get unique domains for HUD
  const uniqueDomains = useMemo(() => {
    const domains: Domain[] = [];
    const seen = new Set<string>();
    denizens.forEach(d => {
      const domainName = d.domain || 'default';
      if (!seen.has(domainName)) {
        seen.add(domainName);
        domains.push({
          id: domainName,
          name: domainName,
          description: '',
          colorHue: 0,
        });
      }
    });
    return domains;
  }, [denizens]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background with particle nebulae */}
      <BackgroundCanvas
        denizens={clusteredDenizens}
        offset={offset}
        scale={scale}
      />

      {/* Entity Cards - using REAL EntityCard component with 3D wrapper */}
      {clusteredDenizens.map((denizen) => {
        const screenX = denizen.position.x * scale + offset.x;
        const screenY = denizen.position.y * scale + offset.y;
        
        return (
          <Card3DWrapper
            key={denizen.id}
            rotationAngle={rotationAngle}
            phiOffset={(denizen as any).phiOffset || 0}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              transform: `translate(-100px, -133px)`, // Center the 200x266 card
            }}
          >
            <EntityCard
              denizen={denizen}
              onClick={() => console.log('Clicked:', denizen.name)}
            />
          </Card3DWrapper>
        );
      })}

      {/* Navigation HUD */}
      <NavigationHUD
        denizens={denizens}
        domains={uniqueDomains}
        offset={offset}
        scale={scale}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Mockup label */}
      <div className={styles.mockupLabel}>
        CELESTIAL MOCKUP — 3D ROTATION TEST
      </div>
    </div>
  );
}
