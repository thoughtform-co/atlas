'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Position, Domain } from '@/lib/types';
import { BackgroundCanvas } from '@/components/constellation/BackgroundCanvas';
import { NavigationHUD, FilterState } from '@/components/constellation/NavigationHUD';
import { clamp } from '@/lib/utils';
import styles from './celestial.module.css';

// Temporarily use static data for mockup
import { denizens as staticDenizens } from '@/data/denizens';

interface DomainSphere {
  domain: string;
  center: Position;
  denizens: Array<{ denizen: Denizen; orbitAngle: number; phiOffset: number }>;
  color: { r: number; g: number; b: number };
}

/**
 * Connection lines from cards to sphere centers
 */
function ConnectionLines({
  domainSpheres,
  rotationAngle,
  orbitRadius,
  scale,
  offset,
}: {
  domainSpheres: DomainSphere[];
  rotationAngle: number;
  orbitRadius: number;
  scale: number;
  offset: Position;
}) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowSize.width === 0) return null;

  return (
    <svg className={styles.connections}>
      {domainSpheres.map(sphere => {
        const centerX = sphere.center.x * scale + offset.x + windowSize.width / 2;
        const centerY = sphere.center.y * scale + offset.y + windowSize.height / 2;
        
        return sphere.denizens.map(({ denizen, orbitAngle, phiOffset }) => {
          const phi = rotationAngle + phiOffset;
          
          const x3d = orbitRadius * Math.sin(orbitAngle) * Math.cos(phi);
          const y3d = orbitRadius * Math.cos(orbitAngle);
          const z3d = orbitRadius * Math.sin(orbitAngle) * Math.sin(phi);
          
          const entityX = (sphere.center.x + x3d) * scale + offset.x + windowSize.width / 2;
          const entityY = (sphere.center.y + y3d) * scale + offset.y + windowSize.height / 2;
          
          const depthAlpha = (z3d + orbitRadius) / (2 * orbitRadius);
          const lineOpacity = 0.08 + depthAlpha * 0.15;
          
          return (
            <line
              key={denizen.id}
              x1={centerX}
              y1={centerY}
              x2={entityX}
              y2={entityY}
              stroke={`rgba(${sphere.color.r}, ${sphere.color.g}, ${sphere.color.b}, ${lineOpacity})`}
              strokeWidth={1}
            />
          );
        });
      })}
    </svg>
  );
}

/**
 * CELESTIAL CONSTELLATION MOCKUP
 * 
 * This is the new constellation view with:
 * - 3D rotating entity cards (transparent terminals)
 * - Spherical domain clusters
 * - Cards orbit around domain centers
 */

interface CelestialEntityCardProps {
  denizen: Denizen;
  sphereCenter: Position;
  orbitAngle: number;
  orbitRadius: number;
  rotationAngle: number;
  scale: number;
  offset: Position;
  domainColor: { r: number; g: number; b: number };
}

function CelestialEntityCard({
  denizen,
  sphereCenter,
  orbitAngle,
  orbitRadius,
  rotationAngle,
  scale,
  offset,
  domainColor,
}: CelestialEntityCardProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);
  
  // Calculate 3D position on sphere
  // theta = vertical angle (how high/low on sphere)
  // phi = horizontal angle (rotation around Y axis) - this one animates
  const theta = orbitAngle;
  const phi = rotationAngle;
  
  // 3D sphere coordinates (Y is up)
  const x3d = orbitRadius * Math.sin(theta) * Math.cos(phi);
  const y3d = orbitRadius * Math.cos(theta);
  const z3d = orbitRadius * Math.sin(theta) * Math.sin(phi);
  
  // Project to 2D screen position
  const screenX = sphereCenter.x + x3d;
  const screenY = sphereCenter.y + y3d;
  
  // Apply view transform
  const viewX = screenX * scale + offset.x + windowSize.width / 2;
  const viewY = screenY * scale + offset.y + windowSize.height / 2;
  
  // Card rotation - face outward from sphere center
  const facingAngle = Math.atan2(z3d, x3d);
  const rotationY = -facingAngle * (180 / Math.PI) + 90;
  const rotationX = (y3d / orbitRadius) * 25;
  
  // Depth-based opacity and scale
  const depthAlpha = (z3d + orbitRadius) / (2 * orbitRadius);
  const cardScale = (0.5 + depthAlpha * 0.7) * scale;
  const cardOpacity = 0.4 + depthAlpha * 0.6;
  
  // Z-index for proper layering
  const zIndex = Math.floor(50 + z3d / 5);
  
  // Threat level colors
  const threatColors: Record<string, string> = {
    'Benign': '#5B8A7A',
    'Cautious': '#CAA554',
    'Volatile': '#D4A574',
    'Existential': '#8B5A5A',
  };
  
  const threatColor = threatColors[denizen.threatLevel] || threatColors['Benign'];
  const glowColor = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.8)`;
  const glowColorDim = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.3)`;

  // Get image URL
  const imageUrl = denizen.image || denizen.thumbnail;

  return (
    <div
      className={styles.cardWrapper}
      style={{
        left: viewX - 50, // Half card width
        top: viewY - 70, // Half card height
        zIndex,
        opacity: cardOpacity,
        // @ts-expect-error CSS custom properties
        '--glow-color': glowColor,
        '--glow-color-dim': glowColorDim,
      }}
    >
      <div
        className={styles.card}
        style={{
          transform: `
            perspective(600px)
            rotateY(${rotationY}deg)
            rotateX(${rotationX}deg)
            scale(${cardScale})
          `,
        }}
      >
        {/* Front face */}
        <div className={styles.cardFront}>
          <div className={styles.cardMedia}>
            {imageUrl ? (
              <img src={imageUrl} alt={denizen.name} className={styles.cardImage} />
            ) : (
              <div className={styles.cardPlaceholder}>{denizen.type[0]}</div>
            )}
            <div className={styles.cardGradient} />
            <div className={styles.cardScanlines} />
            <div className={styles.cardGlyphs}>{denizen.glyphs}</div>
            <div className={styles.cardThreat} style={{ background: threatColor }} title={denizen.threatLevel} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardName}>{denizen.entityClass || denizen.name}</div>
            {denizen.subtitle && <div className={styles.cardSubtitle}>{denizen.subtitle}</div>}
            <div className={styles.cardMeta}>
              <span className={styles.cardType}>TYPE <em>{denizen.type}</em></span>
            </div>
          </div>
          <div className={styles.cornerTL} />
          <div className={styles.cornerBR} />
        </div>
        
        {/* 3D edges */}
        <div className={`${styles.cardEdge} ${styles.cardEdgeRight}`} />
        <div className={`${styles.cardEdge} ${styles.cardEdgeLeft}`} />
        <div className={`${styles.cardEdge} ${styles.cardEdgeTop}`} />
        <div className={`${styles.cardEdge} ${styles.cardEdgeBottom}`} />
        
        {/* Back face */}
        <div className={styles.cardBack}>
          <div className={styles.backPattern} />
          <div className={styles.backGlyph}>◇</div>
        </div>
      </div>
    </div>
  );
}

export default function CelestialConstellationPage() {
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
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

  // Domain colors
  const domainColors: Record<string, { r: number; g: number; b: number }> = {
    'Starhaven Reaches': { r: 202, g: 165, b: 84 },
    'The Gradient Throne': { r: 91, g: 138, b: 122 },
    'default': { r: 180, g: 180, b: 180 },
  };

  // Filter denizens
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

  // Group denizens by domain and calculate sphere centers
  const domainSpheres = useMemo(() => {
    const groups = new Map<string, Denizen[]>();
    filteredDenizens.forEach(d => {
      const domain = d.domain || 'default';
      if (!groups.has(domain)) groups.set(domain, []);
      groups.get(domain)!.push(d);
    });

    const spheres: DomainSphere[] = [];

    const domainArray = Array.from(groups.keys());
    domainArray.forEach((domain, domainIndex) => {
      const group = groups.get(domain)!;
      
      // Position domains horizontally with good separation
      const centerX = (domainIndex - (domainArray.length - 1) / 2) * 700;
      const centerY = 0;
      
      const color = domainColors[domain] || domainColors['default'];
      
      // Distribute entities around sphere
      // Each entity gets a unique theta (vertical) and phi offset (horizontal starting position)
      const denizensWithAngles = group.map((denizen, idx) => {
        // Spread vertically between 0.3π and 0.7π (visible band)
        const theta = Math.PI * (0.35 + (idx / Math.max(group.length - 1, 1)) * 0.3);
        // Spread horizontally around the sphere
        const phiOffset = (idx / group.length) * Math.PI * 2;
        
        return {
          denizen,
          orbitAngle: theta,
          phiOffset,
        };
      });

      spheres.push({
        domain,
        center: { x: centerX, y: centerY },
        denizens: denizensWithAngles,
        color,
      });
    });

    return spheres;
  }, [filteredDenizens]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setRotationAngle(prev => prev + 0.0008);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => clamp(prev * zoomFactor, 0.2, 3));
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
          colorHue: domainColors[domainName] ? 
            Math.round(Math.atan2(domainColors[domainName].g - 128, domainColors[domainName].r - 128) * 180 / Math.PI) : 0,
        });
      }
    });
    return domains;
  }, [denizens]);

  const orbitRadius = 250;

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
        denizens={filteredDenizens}
        offset={offset}
        scale={scale}
      />

      {/* Connection lines to sphere centers */}
      <ConnectionLines
        domainSpheres={domainSpheres}
        rotationAngle={rotationAngle}
        orbitRadius={orbitRadius}
        scale={scale}
        offset={offset}
      />

      {/* 3D Entity Cards */}
      {domainSpheres.map(sphere => 
        sphere.denizens.map(({ denizen, orbitAngle, phiOffset }) => (
          <CelestialEntityCard
            key={denizen.id}
            denizen={denizen}
            sphereCenter={sphere.center}
            orbitAngle={orbitAngle}
            orbitRadius={orbitRadius}
            rotationAngle={rotationAngle + phiOffset}
            scale={scale}
            offset={offset}
            domainColor={sphere.color}
          />
        ))
      )}

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
        CELESTIAL MOCKUP
      </div>
    </div>
  );
}
