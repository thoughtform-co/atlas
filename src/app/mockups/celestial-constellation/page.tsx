'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Position, Domain } from '@/lib/types';
import { NavigationHUD, FilterState } from '@/components/constellation/NavigationHUD';
import { EntityCard } from '@/components/constellation/EntityCard';
import { DenizenModalV3 } from '@/components/constellation/DenizenModalV3';
import styles from './celestial.module.css';

/**
 * CELESTIAL CONSTELLATION MOCKUP
 * 
 * Uses the TWO main domains from the constellation view:
 * - Starhaven Reaches (gold/orange)
 * - The Gradient Throne (teal/white)
 * 
 * Fetches REAL denizens from Supabase (with images!)
 * Entity cards orbit ON spherical domain clusters
 */

// ═══════════════════════════════════════════════════════════════
// THE TWO DOMAINS WE USE
// ═══════════════════════════════════════════════════════════════

const TARGET_DOMAINS = ['Starhaven Reaches', 'The Gradient Throne'] as const;

// Domain colors matching main constellation view
const DOMAIN_COLORS: Record<string, { r: number; g: number; b: number }> = {
  'Starhaven Reaches': { r: 202, g: 165, b: 84 },   // Gold/Orange
  'The Gradient Throne': { r: 180, g: 200, b: 200 }, // Teal/White
};

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  GRID: 3,
  sphereRadius: 180,
  coreIntensity: 0.6,
  particleDensity: 200,
  connectionOpacity: 0.4,
  depthEffect: 0.5,
  rotationSpeed: 0.0008,
  cardOffset: 1.4,
  domainSeparation: 700, // Increased spacing between clusters
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
  baseTheta: number;
  basePhi: number;
  domain: string;
}

function getEntityPosition(entity: EntitySphereData, rotationAngle: number) {
  const theta = entity.baseTheta;
  const phi = entity.basePhi + rotationAngle;
  const r = CONFIG.sphereRadius * CONFIG.cardOffset;
  
  return {
    x: r * Math.sin(theta) * Math.cos(phi),
    y: r * Math.cos(theta),
    z: r * Math.sin(theta) * Math.sin(phi),
  };
}

// ═══════════════════════════════════════════════════════════════
// 3D ENTITY CARD WRAPPER
// ═══════════════════════════════════════════════════════════════

interface CelestialCardProps {
  entity: EntitySphereData;
  sphereCenterX: number;
  sphereCenterY: number;
  rotationAngle: number;
  viewOffset: Position;
  viewScale: number;
  domainColor: { r: number; g: number; b: number };
  isSelected: boolean;
  onClick: (denizen: Denizen, entity: EntitySphereData) => void;
  windowSize: { width: number; height: number };
}

function CelestialEntityCard({
  entity,
  sphereCenterX,
  sphereCenterY,
  rotationAngle,
  viewOffset,
  viewScale,
  domainColor,
  isSelected,
  onClick,
  windowSize,
}: CelestialCardProps) {
  const { denizen } = entity;

  if (windowSize.width === 0) return null;
  
  // Get 3D position on sphere
  const pos = getEntityPosition(entity, rotationAngle);
  
  // TIDALLY LOCKED: Card always faces outward from sphere center
  // atan2(x, z) gives angle from +Z axis to the position vector in XZ plane
  // This makes the card front face away from center at all times
  const rotationY = Math.atan2(pos.x, pos.z) * (180 / Math.PI);
  
  // No X rotation - keeps cards upright and prevents flip artifacts
  const rotationX = 0;
  
  // Project to screen
  const screenCenterX = windowSize.width / 2 + viewOffset.x + sphereCenterX * viewScale;
  const screenCenterY = windowSize.height / 2 + viewOffset.y + sphereCenterY * viewScale;
  
  const projected = project3D(
    pos.x, pos.y, pos.z,
    screenCenterX, screenCenterY,
    viewScale,
    CONFIG.depthEffect
  );
  
  // Depth-based scale and opacity
  const depthScale = 0.6 + projected.depthAlpha * 0.5;
  // Cards at back are dimmer but still visible
  const cardOpacity = isSelected ? 1 : 0.4 + projected.depthAlpha * 0.6;
  // Z-index: always positive (5-50 range), cards behind popup (popup is 100+)
  // pos.z ranges from -sphereRadius to +sphereRadius
  const normalizedZ = (pos.z + CONFIG.sphereRadius * CONFIG.cardOffset) / (CONFIG.sphereRadius * CONFIG.cardOffset * 2);
  const zIndex = Math.floor(5 + normalizedZ * 45);
  
  // Glow colors
  const glowColor = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.6)`;

  return (
    <div
      className={styles.cardWrapper}
      style={{
        left: projected.screenX,
        top: projected.screenY,
        zIndex,
        opacity: cardOpacity,
        // @ts-expect-error CSS custom property
        '--glow-color': glowColor,
      }}
    >
      {/* 3D card container - simple Y rotation only */}
      <div
        className={styles.card3d}
        style={{
          transform: isSelected
            ? `rotateY(0deg) scale(1.1)`
            : `rotateY(${rotationY}deg) scale(${depthScale})`,
        }}
      >
        {/* Card content - visible from both sides (transparent tablet) */}
        <div className={styles.cardFront}>
          <EntityCard
            denizen={denizen}
            onClick={() => onClick(denizen, entity)}
            isSelected={isSelected}
            style={{ position: 'relative', transform: 'none' }}
          />
        </div>
        
        {/* 3D Edge faces for depth effect */}
        <div className={`${styles.cardEdge} ${styles.cardEdgeRight}`} />
        <div className={`${styles.cardEdge} ${styles.cardEdgeLeft}`} />
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

    let animationId: number;
    const draw = () => {
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
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
          ctx.fillRect(star.x - 15, star.y, 30, 1);
        } else {
          ctx.fillStyle = `rgba(236, 227, 214, ${alpha})`;
          ctx.fillRect(Math.floor(star.x / 2) * 2, Math.floor(star.y / 2) * 2, star.size, star.size);
        }
        return true;
      });

      // Draw spheres
      spheres.forEach(sphere => {
        const { color, particles, centerX, centerY, entities } = sphere;
        const screenCenter = worldToScreen(centerX, centerY);
        const screenRadius = CONFIG.sphereRadius * scale;

        // Particles
        particles.forEach(p => {
          const cosR = Math.cos(rotationAngle);
          const sinR = Math.sin(rotationAngle);
          const rx = p.x * cosR - p.z * sinR;
          const rz = p.x * sinR + p.z * cosR;
          
          const projected = project3D(rx, p.y, rz, screenCenter.x, screenCenter.y, scale, CONFIG.depthEffect);
          if (projected.screenX < -50 || projected.screenX > canvas.width + 50 ||
              projected.screenY < -50 || projected.screenY > canvas.height + 50) return;
          
          const breathe = Math.sin(timeRef.current * 0.02 + p.phase) * 0.3 + 0.7;
          let alpha = p.alpha * breathe * projected.depthAlpha;
          if (p.isCore) alpha *= 1.5;
          
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          ctx.fillRect(
            Math.floor(projected.screenX / CONFIG.GRID) * CONFIG.GRID,
            Math.floor(projected.screenY / CONFIG.GRID) * CONFIG.GRID,
            CONFIG.GRID - 1, CONFIG.GRID - 1
          );
        });

        // Core glow
        const gradient = ctx.createRadialGradient(screenCenter.x, screenCenter.y, 0, screenCenter.x, screenCenter.y, screenRadius * 0.5);
        const coreAlpha = CONFIG.coreIntensity * 0.15;
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        const outerGradient = ctx.createRadialGradient(screenCenter.x, screenCenter.y, screenRadius * 0.3, screenCenter.x, screenCenter.y, screenRadius * 1.3);
        outerGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
        outerGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.02)`);
        outerGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Connection lines
        entities.forEach(entity => {
          const pos = getEntityPosition(entity, rotationAngle);
          const projected = project3D(pos.x, pos.y, pos.z, screenCenter.x, screenCenter.y, scale, CONFIG.depthEffect);
          
          const lineGradient = ctx.createLinearGradient(screenCenter.x, screenCenter.y, projected.screenX, projected.screenY);
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
          
          // Node
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${lineAlpha * 1.5})`;
          ctx.beginPath();
          ctx.arc(projected.screenX, projected.screenY, 4, 0, Math.PI * 2);
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
  const [isRotating, setIsRotating] = useState(true);
  const [selectedDenizen, setSelectedDenizen] = useState<Denizen | null>(null);
  const [denizens, setDenizens] = useState<Denizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [filters, setFilters] = useState<FilterState>({
    domains: new Set(),
    entityTypes: new Set(),
    allegiances: new Set(),
  });
  const lastMouseRef = useRef<Position>({ x: 0, y: 0 });

  // Window size for SSR safety
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch REAL denizens from API (with images from Supabase)
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/denizens');
        if (res.ok) {
          const json = await res.json();
          // API returns { success, data: { denizens: [...] } }
          if (json.success && json.data?.denizens) {
            setDenizens(json.data.denizens);
          } else if (Array.isArray(json)) {
            // Fallback if direct array
            setDenizens(json);
          }
        }
      } catch (err) {
        console.error('Failed to fetch denizens:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  // Build TWO domain spheres
  const domainSpheres = useMemo(() => {
    const mapToTargetDomain = (d: Denizen): string => {
      if (d.domain === 'Starhaven Reaches' || d.domain === 'The Gradient Throne') {
        return d.domain;
      }
      if (d.allegiance === 'Nomenclate' || d.threatLevel === 'Existential') {
        return 'The Gradient Throne';
      }
      return d.position.x > 0 ? 'The Gradient Throne' : 'Starhaven Reaches';
    };

    const groups = new Map<string, Denizen[]>();
    TARGET_DOMAINS.forEach(domain => groups.set(domain, []));
    
    filteredDenizens.forEach(d => {
      const domain = mapToTargetDomain(d);
      groups.get(domain)!.push(d);
    });

    const spheres: DomainSphere[] = [];

    TARGET_DOMAINS.forEach((domain, domainIndex) => {
      const group = groups.get(domain) || [];
      if (group.length === 0) return;
      
      const color = DOMAIN_COLORS[domain];
      const centerX = domainIndex === 0 ? -CONFIG.domainSeparation / 2 : CONFIG.domainSeparation / 2;
      const centerY = 0;

      const particles: SphereParticle[] = [];
      for (let i = 0; i < CONFIG.particleDensity * 0.2; i++) {
        particles.push(createSphereParticle(CONFIG.sphereRadius, true));
      }
      for (let i = 0; i < CONFIG.particleDensity * 0.8; i++) {
        particles.push(createSphereParticle(CONFIG.sphereRadius, false));
      }

      const entities: EntitySphereData[] = group.map((denizen, idx) => ({
        denizen,
        baseTheta: Math.PI * (0.3 + (idx / Math.max(group.length - 1, 1)) * 0.4),
        basePhi: (idx / group.length) * Math.PI * 2,
        domain,
      }));

      spheres.push({ domain, centerX, centerY, color, particles, entities });
    });

    return spheres;
  }, [filteredDenizens]);

  // Rotation animation
  useEffect(() => {
    if (!isRotating) return;
    let animationId: number;
    const animate = () => {
      setRotationAngle(prev => prev + CONFIG.rotationSpeed);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isRotating]);

  const handleCardClick = useCallback((denizen: Denizen, entity: EntitySphereData) => {
    // Calculate target rotation to bring this card to the front (z = max)
    // Card is at front when phi + rotationAngle = π/2 (facing viewer)
    const targetPhi = Math.PI / 2; // Front position
    const currentPhi = entity.basePhi;
    // Calculate rotation needed to bring this card to front
    const targetRotation = targetPhi - currentPhi;
    
    // Animate rotation to target
    setRotationAngle(targetRotation);
    setSelectedDenizen(denizen);
    setIsRotating(false);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedDenizen(null);
    setIsRotating(true);
  }, []);

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

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev * zoomFactor)));
  }, []);


  if (windowSize.width === 0) return null;

  return (
    <div
      className={styles.container}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <CelestialCanvas
        spheres={domainSpheres}
        offset={offset}
        scale={scale}
        rotationAngle={rotationAngle}
      />

      {loading ? (
        <div className={styles.loading}>Loading denizens...</div>
      ) : (
        domainSpheres.map(sphere => 
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
              isSelected={selectedDenizen?.id === entity.denizen.id}
              onClick={handleCardClick}
              windowSize={windowSize}
            />
          ))
        )
      )}

      {selectedDenizen && (
        <DenizenModalV3
          denizen={selectedDenizen}
          onClose={handleClosePopup}
        />
      )}

      <NavigationHUD
        denizens={denizens}
        filters={filters}
        onFiltersChange={setFilters}
        filteredCount={filteredDenizens.length}
        totalCount={denizens.length}
      />

      <div className={styles.mockupLabel}>
        CELESTIAL MOCKUP — {loading ? 'LOADING' : isRotating ? 'ROTATING' : 'PAUSED'}
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor />
    </div>
  );
}

// Simple FPS/Performance monitor component
function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationId: number;
    
    const measure = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      // Track last 60 frame times
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }
      
      // Calculate average FPS
      const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      setFps(Math.round(1000 / avgDelta));
      
      // Memory (Chrome only)
      // @ts-expect-error Chrome-specific API
      if (performance.memory) {
        // @ts-expect-error Chrome-specific API
        setMemory(Math.round(performance.memory.usedJSHeapSize / 1024 / 1024));
      }
      
      animationId = requestAnimationFrame(measure);
    };
    
    animationId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 80,
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '0.1em',
      color: fps < 30 ? '#ff6b6b' : fps < 50 ? '#ffd93d' : '#6bcb77',
      zIndex: 100,
      textAlign: 'right',
    }}>
      <div>FPS: {fps}</div>
      {memory !== null && <div>MEM: {memory}MB</div>}
    </div>
  );
}
