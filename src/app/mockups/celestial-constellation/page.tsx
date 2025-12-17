'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Position, Domain } from '@/lib/types';
import { NavigationHUD, FilterState } from '@/components/constellation/NavigationHUD';
import styles from './celestial.module.css';

// Use static data for mockup
import { denizens as staticDenizens } from '@/data/denizens';

/**
 * CELESTIAL CONSTELLATION MOCKUP
 * 
 * Properly converts the HTML mockup to Next.js:
 * - Domain clusters appear as 3D spheres with rotating particles
 * - Entity cards orbit ON the sphere surface using theta/phi angles
 * - Connection lines radiate from sphere center to each card
 * - Cards rotate to face outward as they orbit
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  GRID: 3,
  sphereRadius: 200,
  coreIntensity: 0.6,
  particleDensity: 200,
  connectionOpacity: 0.4,
  depthEffect: 0.5,
  rotationSpeed: 0.0008,
  cardOffset: 1.3, // How far outside the sphere (multiplier of radius)
  domainSeparation: 600, // Distance between domain spheres
};

// Domain colors
const DOMAIN_COLORS: Record<string, { r: number; g: number; b: number }> = {
  'Starhaven Reaches': { r: 202, g: 165, b: 84 },
  'The Gradient Throne': { r: 91, g: 138, b: 122 },
  'Connective Pathways': { r: 140, g: 120, b: 180 },
  'Crystallized Semantics': { r: 120, g: 180, b: 160 },
  'Entry Threshold': { r: 180, g: 140, b: 100 },
  'Fractured Boundaries': { r: 160, g: 100, b: 100 },
  'Interconcept Void': { r: 100, g: 100, b: 140 },
  'default': { r: 180, g: 180, b: 180 },
};

const THREAT_COLORS: Record<string, string> = {
  'Benign': '#5B8A7A',
  'Cautious': '#CAA554',
  'Volatile': '#D4A574',
  'Existential': '#8B5A5A',
};

// ═══════════════════════════════════════════════════════════════
// SPHERE PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════

interface SphereParticle {
  x: number;
  y: number;
  z: number;
  isCore: boolean;
  alpha: number;
  phase: number;
  size: number;
}

function createSphereParticle(radius: number, isCore: boolean): SphereParticle {
  const r = isCore 
    ? Math.random() * radius * 0.3 
    : Math.pow(Math.random(), 0.4) * radius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
    isCore,
    alpha: isCore ? 0.3 + Math.random() * 0.4 : 0.05 + Math.random() * 0.15,
    phase: Math.random() * Math.PI * 2,
    size: CONFIG.GRID,
  };
}

function project3D(
  x: number, y: number, z: number,
  centerX: number, centerY: number,
  scale: number, depthEffect: number
) {
  const screenX = centerX + x * scale;
  const screenY = centerY + y * scale;
  const normalizedZ = z / CONFIG.sphereRadius;
  const depthAlpha = 0.3 + (normalizedZ + 1) * 0.35 * depthEffect;
  return { screenX, screenY, depthAlpha, z };
}

// ═══════════════════════════════════════════════════════════════
// ENTITY WITH SPHERE POSITION
// ═══════════════════════════════════════════════════════════════

interface EntitySphereData {
  denizen: Denizen;
  baseTheta: number; // Vertical angle on sphere (0 to π)
  basePhi: number;   // Horizontal angle on sphere (0 to 2π)
  domain: string;
}

function getEntityPosition(entity: EntitySphereData, rotationAngle: number) {
  const theta = entity.baseTheta;
  const phi = entity.basePhi + rotationAngle; // Rotate around Y axis
  const r = CONFIG.sphereRadius * CONFIG.cardOffset;
  
  return {
    x: r * Math.sin(theta) * Math.cos(phi),
    y: r * Math.cos(theta), // Y is vertical
    z: r * Math.sin(theta) * Math.sin(phi),
  };
}

// ═══════════════════════════════════════════════════════════════
// CELESTIAL ENTITY CARD
// ═══════════════════════════════════════════════════════════════

interface CelestialCardProps {
  entity: EntitySphereData;
  sphereCenterX: number;
  sphereCenterY: number;
  rotationAngle: number;
  viewOffset: Position;
  viewScale: number;
  domainColor: { r: number; g: number; b: number };
}

function CelestialEntityCard({
  entity,
  sphereCenterX,
  sphereCenterY,
  rotationAngle,
  viewOffset,
  viewScale,
  domainColor,
}: CelestialCardProps) {
  const { denizen } = entity;
  
  // Get 3D position on sphere
  const pos = getEntityPosition(entity, rotationAngle);
  
  // Calculate facing angle for card rotation
  const facingAngle = Math.atan2(pos.z, pos.x);
  const rotationY = -facingAngle * (180 / Math.PI) + 90;
  
  // Add X rotation based on vertical position
  const verticalRatio = pos.y / (CONFIG.sphereRadius * CONFIG.cardOffset);
  const rotationX = verticalRatio * 30;
  
  // Project to screen
  const screenCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 + viewOffset.x + sphereCenterX * viewScale : 0;
  const screenCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 + viewOffset.y + sphereCenterY * viewScale : 0;
  
  const projected = project3D(
    pos.x, pos.y, pos.z,
    screenCenterX, screenCenterY,
    viewScale,
    CONFIG.depthEffect
  );
  
  // Depth-based scale and opacity
  const depthScale = 0.5 + projected.depthAlpha * 0.7;
  const cardOpacity = 0.4 + projected.depthAlpha * 0.6;
  const zIndex = Math.floor(50 + pos.z / 5);
  
  // Get image URL
  const imageUrl = denizen.imageUrl || denizen.mediaUrl || '';
  const threatColor = THREAT_COLORS[denizen.threatLevel] || THREAT_COLORS['Benign'];
  
  // Glow colors from domain
  const glowColor = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.8)`;
  const glowColorDim = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.3)`;

  return (
    <div
      className={styles.cardWrapper}
      style={{
        left: projected.screenX - 50,
        top: projected.screenY - 70,
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
            rotateY(${rotationY}deg)
            rotateX(${rotationX}deg)
            scale(${depthScale})
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

// ═══════════════════════════════════════════════════════════════
// CANVAS COMPONENT (Spheres, Particles, Connection Lines)
// ═══════════════════════════════════════════════════════════════

interface DomainSphere {
  domain: string;
  centerX: number;
  centerY: number;
  color: { r: number; g: number; b: number };
  particles: SphereParticle[];
  entities: EntitySphereData[];
}

interface CelestialCanvasProps {
  spheres: DomainSphere[];
  offset: Position;
  scale: number;
  rotationAngle: number;
}

function CelestialCanvas({ spheres, offset, scale, rotationAngle }: CelestialCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; life: number; maxLife: number; type: string }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const worldToScreen = (worldX: number, worldY: number) => ({
      x: canvas.width / 2 + offset.x + worldX * scale,
      y: canvas.height / 2 + offset.y + worldY * scale,
    });

    // Animation loop
    let animationId: number;
    const draw = () => {
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      if (starsRef.current.length < 60 && Math.random() < 0.08) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 1 + Math.random() * 2,
          life: 0,
          maxLife: 30 + Math.random() * 60,
          type: Math.random() < 0.3 ? 'glitch' : 'star',
        });
      }
      starsRef.current = starsRef.current.filter(star => {
        star.life++;
        if (star.life >= star.maxLife) return false;
        
        const progress = star.life / star.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.4;
        
        if (star.type === 'glitch') {
          ctx.fillStyle = `rgba(236, 227, 214, ${alpha * 0.3})`;
          const glitchWidth = 20 + Math.random() * 40;
          ctx.fillRect(star.x - glitchWidth / 2, star.y, glitchWidth, 1);
        } else {
          ctx.fillStyle = `rgba(236, 227, 214, ${alpha})`;
          ctx.fillRect(Math.floor(star.x / 2) * 2, Math.floor(star.y / 2) * 2, star.size, star.size);
        }
        return true;
      });

      // Draw each sphere
      spheres.forEach(sphere => {
        const { color, particles, centerX, centerY, entities } = sphere;
        const screenCenter = worldToScreen(centerX, centerY);
        const screenRadius = CONFIG.sphereRadius * scale;

        // Rotate and draw particles
        particles.forEach(p => {
          const cosR = Math.cos(rotationAngle);
          const sinR = Math.sin(rotationAngle);
          const rx = p.x * cosR - p.z * sinR;
          const rz = p.x * sinR + p.z * cosR;
          
          const projected = project3D(rx, p.y, rz, screenCenter.x, screenCenter.y, scale, CONFIG.depthEffect);
          
          if (projected.screenX < -50 || projected.screenX > canvas.width + 50 ||
              projected.screenY < -50 || projected.screenY > canvas.height + 50) {
            return;
          }
          
          const breathe = Math.sin(timeRef.current * 0.02 + p.phase) * 0.3 + 0.7;
          let alpha = p.alpha * breathe * projected.depthAlpha;
          if (p.isCore) alpha *= 1.5;
          
          const px = Math.floor(projected.screenX / CONFIG.GRID) * CONFIG.GRID;
          const py = Math.floor(projected.screenY / CONFIG.GRID) * CONFIG.GRID;
          
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          ctx.fillRect(px, py, CONFIG.GRID - 1, CONFIG.GRID - 1);
        });

        // Draw sphere core glow
        const gradient = ctx.createRadialGradient(
          screenCenter.x, screenCenter.y, 0,
          screenCenter.x, screenCenter.y, screenRadius * 0.5
        );
        const coreAlpha = CONFIG.coreIntensity * 0.15;
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer glow
        const outerGradient = ctx.createRadialGradient(
          screenCenter.x, screenCenter.y, screenRadius * 0.3,
          screenCenter.x, screenCenter.y, screenRadius * 1.3
        );
        outerGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
        outerGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.02)`);
        outerGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection lines from entities to center
        entities.forEach(entity => {
          const pos = getEntityPosition(entity, rotationAngle);
          const projected = project3D(pos.x, pos.y, pos.z, screenCenter.x, screenCenter.y, scale, CONFIG.depthEffect);
          
          const lineGradient = ctx.createLinearGradient(
            screenCenter.x, screenCenter.y,
            projected.screenX, projected.screenY
          );
          const lineAlpha = CONFIG.connectionOpacity * projected.depthAlpha;
          lineGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 0.8})`);
          lineGradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 0.4})`);
          lineGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 0.1})`);
          
          ctx.strokeStyle = lineGradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenCenter.x, screenCenter.y);
          ctx.lineTo(projected.screenX, projected.screenY);
          ctx.stroke();
          
          // Connection point
          const nodeAlpha = lineAlpha * 1.5;
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${nodeAlpha})`;
          ctx.beginPath();
          ctx.arc(projected.screenX, projected.screenY, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Node glow
          const nodeGlow = ctx.createRadialGradient(
            projected.screenX, projected.screenY, 0,
            projected.screenX, projected.screenY, 12
          );
          nodeGlow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${nodeAlpha * 0.5})`);
          nodeGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(projected.screenX, projected.screenY, 12, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      timeRef.current++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [spheres, offset, scale, rotationAngle]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CelestialConstellationPage() {
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    domains: new Set(),
    entityTypes: new Set(),
    allegiances: new Set(),
  });
  const lastMouseRef = useRef<Position>({ x: 0, y: 0 });

  // Use static data
  const denizens = staticDenizens;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Build domain spheres with entities positioned on sphere surface
  const domainSpheres = useMemo(() => {
    // Group by domain
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
      const color = DOMAIN_COLORS[domain] || DOMAIN_COLORS['default'];
      
      // Position domains horizontally
      const centerX = (domainIndex - (domainArray.length - 1) / 2) * CONFIG.domainSeparation;
      const centerY = 0;

      // Create particles
      const particles: SphereParticle[] = [];
      for (let i = 0; i < CONFIG.particleDensity * 0.2; i++) {
        particles.push(createSphereParticle(CONFIG.sphereRadius, true));
      }
      for (let i = 0; i < CONFIG.particleDensity * 0.8; i++) {
        particles.push(createSphereParticle(CONFIG.sphereRadius, false));
      }

      // Assign each entity a position ON the sphere (theta, phi)
      const entities: EntitySphereData[] = group.map((denizen, idx) => ({
        denizen,
        // Spread vertically between 0.3π and 0.7π (visible band)
        baseTheta: Math.PI * (0.3 + (idx / Math.max(group.length - 1, 1)) * 0.4),
        // Spread horizontally around sphere
        basePhi: (idx / group.length) * Math.PI * 2,
        domain,
      }));

      spheres.push({
        domain,
        centerX,
        centerY,
        color,
        particles,
        entities,
      });
    });

    return spheres;
  }, [filteredDenizens]);

  // Animation loop for rotation
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setRotationAngle(prev => prev + CONFIG.rotationSpeed);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${styles.cardWrapper}`)) return;
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
    setScale(prev => Math.max(0.3, Math.min(3, prev * zoomFactor)));
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

  if (!mounted) return null;

  return (
    <div
      className={styles.container}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Canvas renders spheres, particles, connection lines */}
      <CelestialCanvas
        spheres={domainSpheres}
        offset={offset}
        scale={scale}
        rotationAngle={rotationAngle}
      />

      {/* Entity Cards - positioned on sphere surface */}
      {domainSpheres.map(sphere => 
        sphere.entities.map(entity => (
          <CelestialEntityCard
            key={entity.denizen.id}
            entity={entity}
            sphereCenterX={sphere.centerX}
            sphereCenterY={sphere.centerY}
            rotationAngle={rotationAngle}
            viewOffset={offset}
            viewScale={scale}
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
        CELESTIAL MOCKUP — SPHERICAL ORBIT TEST
      </div>
    </div>
  );
}
