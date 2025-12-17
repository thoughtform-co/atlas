'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Position, Domain } from '@/lib/types';
import { NavigationHUD, FilterState } from '@/components/constellation/NavigationHUD';
import { EntityCard } from '@/components/constellation/EntityCard';
import { DenizenModalV3 } from '@/components/constellation/DenizenModalV3';
import styles from './celestial.module.css';

// Use static data for mockup
import { denizens as staticDenizens } from '@/data/denizens';

/**
 * CELESTIAL CONSTELLATION MOCKUP
 * 
 * Uses the TWO main domains from the constellation view:
 * - Starhaven Reaches (gold/orange)
 * - The Gradient Throne (teal/white)
 * 
 * Entity cards orbit ON spherical domain clusters
 * Uses the REAL EntityCard component for full functionality
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
  sphereRadius: 200,
  coreIntensity: 0.6,
  particleDensity: 200,
  connectionOpacity: 0.4,
  depthEffect: 0.5,
  rotationSpeed: 0.0008,
  cardOffset: 1.3, // How far outside the sphere (multiplier of radius)
  domainSeparation: 500, // Distance between the TWO domain spheres
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
  onClick: (denizen: Denizen) => void;
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
}: CelestialCardProps) {
  const { denizen } = entity;
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowSize.width === 0) return null;
  
  // Get 3D position on sphere
  const pos = getEntityPosition(entity, rotationAngle);
  
  // Calculate facing angle for card rotation
  const facingAngle = Math.atan2(pos.z, pos.x);
  const rotationY = -facingAngle * (180 / Math.PI) + 90;
  
  // Add X rotation based on vertical position
  const verticalRatio = pos.y / (CONFIG.sphereRadius * CONFIG.cardOffset);
  const rotationX = verticalRatio * 30;
  
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
  const depthScale = 0.5 + projected.depthAlpha * 0.7;
  const cardOpacity = isSelected ? 1 : 0.4 + projected.depthAlpha * 0.6;
  const zIndex = isSelected ? 1000 : Math.floor(50 + pos.z / 5);
  
  // Glow colors from domain
  const glowColor = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.8)`;
  const glowColorDim = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, 0.3)`;

  // When selected, card comes to center and faces forward
  const selectedStyle = isSelected ? {
    left: windowSize.width / 2 - 100,
    top: windowSize.height / 2 - 133,
    transform: 'none',
    opacity: 1,
  } : {};

  return (
    <div
      className={`${styles.cardWrapper} ${isSelected ? styles.cardSelected : ''}`}
      style={{
        left: projected.screenX - 100,
        top: projected.screenY - 133,
        zIndex,
        opacity: cardOpacity,
        // @ts-expect-error CSS custom properties
        '--glow-color': glowColor,
        '--glow-color-dim': glowColorDim,
        ...selectedStyle,
      }}
    >
      <div
        className={styles.card3dContainer}
        style={{
          transform: isSelected 
            ? 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1.2)'
            : `perspective(800px) rotateY(${rotationY}deg) rotateX(${rotationX}deg) scale(${depthScale})`,
        }}
      >
        {/* Use the REAL EntityCard component */}
        <EntityCard
          denizen={denizen}
          onClick={() => onClick(denizen)}
          isSelected={isSelected}
        />
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
  const [isRotating, setIsRotating] = useState(true); // Rotation state
  const [mounted, setMounted] = useState(false);
  const [selectedDenizen, setSelectedDenizen] = useState<Denizen | null>(null);
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

  // Build TWO domain spheres - Starhaven Reaches and The Gradient Throne
  const domainSpheres = useMemo(() => {
    // Map each denizen to one of the two target domains
    // Use their actual domain if it matches, otherwise assign based on allegiance/type
    const mapToTargetDomain = (d: Denizen): string => {
      // If denizen already has one of the target domains, use it
      if (d.domain === 'Starhaven Reaches' || d.domain === 'The Gradient Throne') {
        return d.domain;
      }
      // Otherwise, map based on allegiance or position
      // Nomenclate/hostile -> Gradient Throne, others -> Starhaven Reaches
      if (d.allegiance === 'Nomenclate' || d.threatLevel === 'Existential') {
        return 'The Gradient Throne';
      }
      // Roughly split: use index-based distribution for demo
      return d.position.x > 0 ? 'The Gradient Throne' : 'Starhaven Reaches';
    };

    // Group by the two target domains
    const groups = new Map<string, Denizen[]>();
    TARGET_DOMAINS.forEach(domain => groups.set(domain, []));
    
    filteredDenizens.forEach(d => {
      const domain = mapToTargetDomain(d);
      groups.get(domain)!.push(d);
    });

    const spheres: DomainSphere[] = [];

    TARGET_DOMAINS.forEach((domain, domainIndex) => {
      const group = groups.get(domain) || [];
      if (group.length === 0) return; // Skip empty domains
      
      const color = DOMAIN_COLORS[domain];
      
      // Position the two domains horizontally: left and right
      const centerX = domainIndex === 0 ? -CONFIG.domainSeparation / 2 : CONFIG.domainSeparation / 2;
      const centerY = 0;

      // Create particles for this sphere
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

  // Animation loop for rotation - STOPS when a card is selected
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

  // Handle card click - stop rotation and show popup
  const handleCardClick = useCallback((denizen: Denizen) => {
    setSelectedDenizen(denizen);
    setIsRotating(false); // Stop rotation when card is selected
  }, []);

  // Handle popup close - resume rotation
  const handleClosePopup = useCallback(() => {
    setSelectedDenizen(null);
    setIsRotating(true); // Resume rotation when popup closes
  }, []);

  // Mouse handlers
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
    setScale(prev => Math.max(0.3, Math.min(3, prev * zoomFactor)));
  }, []);

  // Only show the TWO target domains in HUD
  const uniqueDomains = useMemo(() => {
    return TARGET_DOMAINS.map(name => ({
      id: name,
      name,
      description: '',
      colorHue: name === 'Starhaven Reaches' ? 40 : 170,
    }));
  }, []);

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

      {/* Entity Cards - using REAL EntityCard with 3D wrapper */}
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
            isSelected={selectedDenizen?.id === entity.denizen.id}
            onClick={handleCardClick}
          />
        ))
      )}

      {/* Entity Modal - same as main constellation view */}
      {selectedDenizen && (
        <DenizenModalV3
          denizen={selectedDenizen}
          onClose={handleClosePopup}
        />
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
        CELESTIAL MOCKUP — {isRotating ? 'ROTATING' : 'PAUSED'}
      </div>
    </div>
  );
}
