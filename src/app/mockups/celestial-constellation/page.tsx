'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Denizen, Position } from '@/lib/types';
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

type AttractorType = 'galaxy' | 'lorenz' | 'halvorsen' | 'aizawa' | 'thomas' | 'sprott' | 'rossler' | 'dadras';

interface Config {
  GRID: number;
  sphereRadius: number;
  coreIntensity: number;
  particleDensity: number;
  connectionOpacity: number;
  depthEffect: number;
  rotationSpeed: number;
  cardOffset: number;
  domainSeparation: number;
  cardGlow: number; // 0-1, glow intensity
  coreParticleRatio: number; // 0-1, percentage of particles in core vs shell
  nebulaScale: number; // size multiplier for the nebula cloud
  attractorType: AttractorType; // shape generator
  // Background effects (all off by default for safety)
  showBackgroundStars: boolean;
  showNebulae: boolean;
  showScanLines: boolean;
  showVignette: boolean;
}

const DEFAULT_CONFIG: Config = {
  GRID: 2, // Finer grid for higher resolution
  sphereRadius: 180,
  coreIntensity: 0.6,
  particleDensity: 800, // Higher density for attractor effect
  connectionOpacity: 0.4,
  depthEffect: 0.5,
  rotationSpeed: 0.0003,
  cardOffset: 1.4,
  domainSeparation: 700,
  cardGlow: 0.6, // glow intensity (0-1)
  coreParticleRatio: 0.2, // 20% in core, 80% in shell
  nebulaScale: 1.0, // nebula cloud size multiplier
  attractorType: 'lorenz', // default to lorenz attractor
  // Background effects
  showBackgroundStars: true,
  showNebulae: true,
  showScanLines: false,
  showVignette: true, // vignette is safe, just darkens edges
};

// Mutable config for non-React code (canvas)
let CONFIG = { ...DEFAULT_CONFIG };

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

// ═══════════════════════════════════════════════════════════════
// STRANGE ATTRACTOR GENERATORS
// ═══════════════════════════════════════════════════════════════

// Pre-compute attractor points for performance
function generateAttractorPoints(type: AttractorType, count: number): Array<{x: number, y: number, z: number}> {
  const points: Array<{x: number, y: number, z: number}> = [];
  
  // Initial conditions with slight randomization per domain
  let x = 0.1 + Math.random() * 0.1;
  let y = 0.1 + Math.random() * 0.1;
  let z = 0.1 + Math.random() * 0.1;
  
  const dt = 0.005; // Time step
  const warmup = 500; // Skip initial transients
  
  // Different attractor equations
  for (let i = 0; i < count + warmup; i++) {
    let dx = 0, dy = 0, dz = 0;
    
    switch (type) {
      case 'lorenz':
        // Lorenz attractor - classic butterfly
        const sigma = 10, rho = 28, beta = 8/3;
        dx = sigma * (y - x);
        dy = x * (rho - z) - y;
        dz = x * y - beta * z;
        break;
        
      case 'halvorsen':
        // Halvorsen attractor - twisted loops
        const a = 1.89;
        dx = -a * x - 4 * y - 4 * z - y * y;
        dy = -a * y - 4 * z - 4 * x - z * z;
        dz = -a * z - 4 * x - 4 * y - x * x;
        break;
        
      case 'aizawa':
        // Aizawa attractor - disc with axis
        const aA = 0.95, bA = 0.7, cA = 0.6, dA = 3.5, eA = 0.25, fA = 0.1;
        dx = (z - bA) * x - dA * y;
        dy = dA * x + (z - bA) * y;
        dz = cA + aA * z - (z * z * z) / 3 - (x * x + y * y) * (1 + eA * z) + fA * z * x * x * x;
        break;
        
      case 'thomas':
        // Thomas attractor - smooth, symmetric
        const bT = 0.208186;
        dx = Math.sin(y) - bT * x;
        dy = Math.sin(z) - bT * y;
        dz = Math.sin(x) - bT * z;
        break;
        
      case 'sprott':
        // Sprott B attractor - elegant spiral
        const aS = 0.4, bS = 1.2;
        dx = aS * y * z;
        dy = x - y;
        dz = bS - x * y;
        break;
        
      case 'rossler':
        // Rössler attractor - spiral with fold
        const aR = 0.2, bR = 0.2, cR = 5.7;
        dx = -(y + z);
        dy = x + aR * y;
        dz = bR + z * (x - cR);
        break;
        
      case 'dadras':
        // Dadras attractor - complex flow
        const p = 3, q = 2.7, r = 1.7, s = 2, e = 9;
        dx = y - p * x + q * y * z;
        dy = r * y - x * z + z;
        dz = s * x * y - e * z;
        break;
        
      case 'galaxy':
      default:
        // Galaxy spiral - use parametric equations
        const t = i * 0.01;
        const armCount = 2;
        const arm = i % armCount;
        const armAngle = arm * Math.PI * 2 / armCount;
        const rG = Math.pow(t % 10, 0.5) * 2;
        const spiral = t * 0.3 + armAngle;
        x = rG * Math.cos(spiral) + (Math.random() - 0.5) * 0.5;
        z = rG * Math.sin(spiral) + (Math.random() - 0.5) * 0.5;
        y = (Math.random() - 0.5) * 0.3 * Math.exp(-rG * 0.1);
        if (i >= warmup) {
          points.push({ x, y, z });
        }
        continue;
    }
    
    // Euler integration
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    
    // Skip warmup period
    if (i >= warmup) {
      points.push({ x, y, z });
    }
  }
  
  return points;
}

// Normalize and scale attractor points to fit radius
function normalizeAttractorPoints(
  points: Array<{x: number, y: number, z: number}>,
  radius: number,
  scale: number
): Array<{x: number, y: number, z: number}> {
  if (points.length === 0) return points;
  
  // Find bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  
  // Center and scale
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const rangeMax = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scaleFactor = (radius * 2 * scale) / rangeMax;
  
  return points.map(p => ({
    x: (p.x - centerX) * scaleFactor,
    y: (p.y - centerY) * scaleFactor,
    z: (p.z - centerZ) * scaleFactor,
  }));
}

function createAttractorParticle(
  attractorPoints: Array<{x: number, y: number, z: number}>,
  isCore: boolean
): SphereParticle {
  // Pick a random point from the attractor
  const idx = Math.floor(Math.random() * attractorPoints.length);
  const basePoint = attractorPoints[idx] || { x: 0, y: 0, z: 0 };
  
  // Add some noise for volume
  const noiseScale = isCore ? 2 : 8;
  const x = basePoint.x + (Math.random() - 0.5) * noiseScale;
  const y = basePoint.y + (Math.random() - 0.5) * noiseScale;
  const z = basePoint.z + (Math.random() - 0.5) * noiseScale;
  
  return {
    x, y, z,
    isCore,
    alpha: isCore ? 0.4 + Math.random() * 0.5 : 0.03 + Math.random() * 0.12,
    phase: Math.random() * Math.PI * 2,
    size: CONFIG.GRID * (0.6 + Math.random() * 0.6),
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
  cardGlow: number;
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
  cardGlow,
}: CelestialCardProps) {
  const { denizen } = entity;

  if (windowSize.width === 0) return null;
  
  // Get 3D position on sphere
  const pos = getEntityPosition(entity, rotationAngle);
  
  // TIDALLY LOCKED: Card always faces outward from sphere center
  // Use the continuous phi angle directly instead of atan2 to avoid
  // the ±180° branch cut discontinuity that causes flip artifacts
  const continuousPhi = entity.basePhi + rotationAngle;
  const rotationY = 90 - (continuousPhi * (180 / Math.PI));
  
  // No X rotation - keeps cards upright
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
  
  // Depth-based scale AND zoom scale combined
  // depthScale: cards further away (lower z) are smaller
  // viewScale: zooming out makes everything smaller proportionally
  const depthScale = 0.6 + projected.depthAlpha * 0.5;
  const combinedScale = depthScale * viewScale;
  // Cards at back are dimmer but still visible
  const cardOpacity = isSelected ? 1 : 0.4 + projected.depthAlpha * 0.6;
  // Z-index: always positive (5-50 range), cards behind popup (popup is 100+)
  // pos.z ranges from -sphereRadius to +sphereRadius
  const normalizedZ = (pos.z + CONFIG.sphereRadius * CONFIG.cardOffset) / (CONFIG.sphereRadius * CONFIG.cardOffset * 2);
  const zIndex = Math.floor(5 + normalizedZ * 45);
  
  // Glow colors - intensity controlled by slider
  const glowIntensity = cardGlow;
  const glowColor = `rgba(${domainColor.r}, ${domainColor.g}, ${domainColor.b}, ${glowIntensity})`;

  return (
    <div
      className={styles.cardWrapper}
      style={{
        left: projected.screenX,
        top: projected.screenY,
        zIndex,
        opacity: cardOpacity,
        '--glow-color': glowColor,
        '--glow-opacity': String(glowIntensity * 0.5),
        '--glow-spread': `${30 + glowIntensity * 40}px`,
      } as React.CSSProperties}
    >
      {/* 3D card container - simple Y rotation only */}
      <div
        className={styles.card3d}
        style={{
          transform: isSelected
            ? `rotateY(0deg) scale(${viewScale * 1.1})`
            : `rotateY(${rotationY}deg) scale(${combinedScale})`,
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

// Static background star field
interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

// Nebula cloud for background atmosphere
interface NebulaCloud {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  color: { r: number; g: number; b: number };
  opacity: number;
  // Gentle drift
  driftX: number;
  driftY: number;
  driftRotation: number;
}

function CelestialCanvas({ spheres, offset, scale, rotationAngle }: CelestialCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const backgroundStarsRef = useRef<BackgroundStar[]>([]);
  const nebulaeRef = useRef<NebulaCloud[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;
    
    // Initialize static background elements once
    const initBackground = () => {
      // Generate static star field (200-400 stars)
      const starCount = 250 + Math.floor(Math.random() * 150);
      backgroundStarsRef.current = [];
      for (let i = 0; i < starCount; i++) {
        backgroundStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() < 0.7 ? 1 : (Math.random() < 0.9 ? 2 : 3),
          brightness: 0.15 + Math.random() * 0.25,
          twinkleSpeed: 0.0005 + Math.random() * 0.001, // Very slow twinkle
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
      
      // Generate subtle nebula clouds (3-5)
      const nebulaCount = 3 + Math.floor(Math.random() * 3);
      nebulaeRef.current = [];
      const nebulaColors = [
        { r: 80, g: 60, b: 40 },    // Warm brown
        { r: 60, g: 70, b: 80 },    // Cool blue-grey
        { r: 70, g: 50, b: 60 },    // Dusty purple
        { r: 50, g: 60, b: 55 },    // Muted teal
        { r: 90, g: 75, b: 50 },    // Amber dust
      ];
      for (let i = 0; i < nebulaCount; i++) {
        nebulaeRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radiusX: 150 + Math.random() * 300,
          radiusY: 100 + Math.random() * 200,
          rotation: Math.random() * Math.PI,
          color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
          opacity: 0.015 + Math.random() * 0.025,
          // Extremely slow drift velocities (barely perceptible)
          driftX: (Math.random() - 0.5) * 0.001,
          driftY: (Math.random() - 0.5) * 0.001,
          driftRotation: (Math.random() - 0.5) * 0.000005,
        });
      }
      initializedRef.current = true;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-apply after resize
      ctx.imageSmoothingEnabled = false;
      // Only initialize background ONCE - not on every effect re-run
      if (!initializedRef.current) {
        initBackground();
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const worldToScreen = (worldX: number, worldY: number) => ({
      x: canvas.width / 2 + offset.x + worldX * scale,
      y: canvas.height / 2 + offset.y + worldY * scale,
    });

    let animationId: number;
    const draw = () => {
      // Base background
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // ─── NEBULA CLOUDS (subtle background atmosphere) ───
      if (CONFIG.showNebulae) {
        nebulaeRef.current.forEach(nebula => {
          // Gentle drift - update position slowly
          nebula.x += nebula.driftX;
          nebula.y += nebula.driftY;
          nebula.rotation += nebula.driftRotation;
          
          // Wrap around screen edges
          if (nebula.x < -nebula.radiusX) nebula.x = canvas.width + nebula.radiusX;
          if (nebula.x > canvas.width + nebula.radiusX) nebula.x = -nebula.radiusX;
          if (nebula.y < -nebula.radiusY) nebula.y = canvas.height + nebula.radiusY;
          if (nebula.y > canvas.height + nebula.radiusY) nebula.y = -nebula.radiusY;
          
          ctx.save();
          ctx.translate(nebula.x, nebula.y);
          ctx.rotate(nebula.rotation);

          // Fixed size - no breathing/flickering
          const rx = nebula.radiusX;
          const ry = nebula.radiusY;

          // Multiple layered gradients for depth
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
          const { r, g, b } = nebula.color;
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${nebula.opacity * 1.5})`);
          gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${nebula.opacity})`);
          gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${nebula.opacity * 0.5})`);
          gradient.addColorStop(1, 'transparent');

          ctx.scale(1, ry / rx);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      
      // ─── STATIC STAR FIELD (persistent background) ───
      if (CONFIG.showBackgroundStars) {
        backgroundStarsRef.current.forEach(star => {
          // Static brightness - no flickering
          const alpha = star.brightness;

          // Fixed color based on star's phase (warm/cool variation)
          const warmth = Math.sin(star.twinklePhase) * 0.5 + 0.5;
          const r = Math.round(236 - warmth * 20);
          const g = Math.round(227 - warmth * 10);
          const b = Math.round(214 + warmth * 20);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(
            Math.round(star.x),
            Math.round(star.y),
            star.size,
            star.size
          );
        });
      }
      

      // Draw spheres
      spheres.forEach(sphere => {
        const { color, particles, centerX, centerY, entities } = sphere;
        const screenCenter = worldToScreen(centerX, centerY);
        const screenRadius = CONFIG.sphereRadius * scale;

        // Particles - crisp pixel rendering (no anti-aliasing blur)
        particles.forEach(p => {
          const cosR = Math.cos(rotationAngle);
          const sinR = Math.sin(rotationAngle);
          const rx = p.x * cosR - p.z * sinR;
          const rz = p.x * sinR + p.z * cosR;

          const projected = project3D(rx, p.y, rz, screenCenter.x, screenCenter.y, scale, CONFIG.depthEffect);
          if (projected.screenX < -50 || projected.screenX > canvas.width + 50 ||
              projected.screenY < -50 || projected.screenY > canvas.height + 50) return;

          // Static alpha - no breathing animation
          let alpha = p.alpha * projected.depthAlpha;
          if (p.isCore) alpha *= 1.5;

          // Core particles slightly larger, with depth variation
          const baseSize = p.isCore ? CONFIG.GRID + 1 : CONFIG.GRID;
          const pSize = Math.max(1, Math.round(baseSize * (0.6 + projected.depthAlpha * 0.5)));

          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          
          // Crisp pixel-aligned rectangles (no anti-aliasing)
          ctx.fillRect(
            Math.round(projected.screenX),
            Math.round(projected.screenY),
            pSize,
            pSize
          );
        });

        // Core glow - elliptical for galaxy shape
        ctx.save();
        ctx.translate(screenCenter.x, screenCenter.y);
        ctx.scale(1, 0.4); // Flatten vertically for galaxy disc effect
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, screenRadius * 0.6);
        const coreAlpha = CONFIG.coreIntensity * 0.2;
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha})`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha * 0.6})`);
        gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${coreAlpha * 0.2})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Outer galaxy glow - wider ellipse
        ctx.save();
        ctx.translate(screenCenter.x, screenCenter.y);
        ctx.scale(1, 0.35); // Even flatter for outer disc
        
        const outerGradient = ctx.createRadialGradient(0, 0, screenRadius * 0.2, 0, 0, screenRadius * 1.5);
        outerGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.06)`);
        outerGradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, 0.03)`);
        outerGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.01)`);
        outerGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

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
      
      // ─── SUBTLE VIGNETTE (frames the view) ───
      if (CONFIG.showVignette) {
        const vignetteGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
          canvas.width / 2, canvas.height / 2, canvas.height * 0.9
        );
        vignetteGradient.addColorStop(0, 'transparent');
        vignetteGradient.addColorStop(0.7, 'rgba(5, 4, 3, 0.15)');
        vignetteGradient.addColorStop(1, 'rgba(5, 4, 3, 0.4)');
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // ─── OCCASIONAL DATA LATTICE HINTS ───
      if (CONFIG.showScanLines && Math.random() < 0.003) {
        // Rare horizontal scan line
        const scanY = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(202, 165, 84, 0.025)';
        ctx.fillRect(0, scanY, canvas.width, 1);
      }

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
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const lastMouseRef = useRef<Position>({ x: 0, y: 0 });
  const configLoadedRef = useRef(false);

  // Load config from localStorage on mount
  useEffect(() => {
    if (configLoadedRef.current) return;
    configLoadedRef.current = true;
    
    try {
      const saved = localStorage.getItem('celestial-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to load celestial config:', e);
    }
  }, []);

  // Save config to localStorage when it changes
  useEffect(() => {
    if (!configLoadedRef.current) return; // Don't save before initial load
    try {
      localStorage.setItem('celestial-config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save celestial config:', e);
    }
  }, [config]);

  // Sync mutable CONFIG when state changes
  useEffect(() => {
    Object.assign(CONFIG, config);
  }, [config]);

  const updateConfig = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG });
    try {
      localStorage.removeItem('celestial-config');
    } catch (e) {
      console.warn('Failed to clear celestial config:', e);
    }
  }, []);

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

  // Build TWO domain spheres - rebuild when config changes
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
      const centerX = domainIndex === 0 ? -config.domainSeparation / 2 : config.domainSeparation / 2;
      const centerY = 0;

      // Generate attractor base points
      const attractorPoints = normalizeAttractorPoints(
        generateAttractorPoints(config.attractorType, Math.max(2000, config.particleDensity)),
        config.sphereRadius,
        config.nebulaScale
      );
      
      const particles: SphereParticle[] = [];
      // Core particles (dense center) - controlled by coreParticleRatio
      for (let i = 0; i < config.particleDensity * config.coreParticleRatio; i++) {
        particles.push(createAttractorParticle(attractorPoints, true));
      }
      // Shell particles (outer form) - the rest
      for (let i = 0; i < config.particleDensity * (1 - config.coreParticleRatio); i++) {
        particles.push(createAttractorParticle(attractorPoints, false));
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
  }, [filteredDenizens, config.domainSeparation, config.particleDensity, config.sphereRadius, config.coreParticleRatio, config.nebulaScale, config.attractorType]);

  // Rotation animation
  useEffect(() => {
    if (!isRotating) return;
    let animationId: number;
    const animate = () => {
      setRotationAngle(prev => prev + config.rotationSpeed);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isRotating, config.rotationSpeed]);

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
    const target = e.target as HTMLElement;
    // Don't start drag if clicking on interactive elements
    if (target.closest('.entity-card')) return;
    if (target.closest('button')) return;
    if (target.closest('input')) return;
    if (target.closest('[class*="settingsPanel"]')) return;
    if (target.closest('[class*="settingsButton"]')) return;
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
              cardGlow={config.cardGlow}
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

      {/* Settings Button */}
      <button
        className={`${styles.settingsButton} ${showSettings ? styles.active : ''}`}
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsTitle}>Celestial Settings</div>

          {/* Particles Section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Particles</div>
            
            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Density</span>
                <span className={styles.settingsValue}>{config.particleDensity}</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="100"
                max="2000"
                value={config.particleDensity}
                onChange={(e) => updateConfig('particleDensity', Number(e.target.value))}
              />
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Core Intensity</span>
                <span className={styles.settingsValue}>{config.coreIntensity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="0"
                max="100"
                value={config.coreIntensity * 100}
                onChange={(e) => updateConfig('coreIntensity', Number(e.target.value) / 100)}
              />
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Depth Effect</span>
                <span className={styles.settingsValue}>{config.depthEffect.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="0"
                max="100"
                value={config.depthEffect * 100}
                onChange={(e) => updateConfig('depthEffect', Number(e.target.value) / 100)}
              />
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Core Particle Ratio</span>
                <span className={styles.settingsValue}>{Math.round(config.coreParticleRatio * 100)}%</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="5"
                max="80"
                value={config.coreParticleRatio * 100}
                onChange={(e) => updateConfig('coreParticleRatio', Number(e.target.value) / 100)}
              />
            </div>
          </div>

          {/* Cards Section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Cards</div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Glow Intensity</span>
                <span className={styles.settingsValue}>{Math.round(config.cardGlow * 100)}%</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="0"
                max="100"
                value={config.cardGlow * 100}
                onChange={(e) => updateConfig('cardGlow', Number(e.target.value) / 100)}
              />
            </div>

          </div>

          {/* Nebula Section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Nebula Shape</div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Attractor</span>
              </label>
              <select
                className={styles.settingsSelect}
                value={config.attractorType}
                onChange={(e) => updateConfig('attractorType', e.target.value as AttractorType)}
              >
                <option value="lorenz">Lorenz (Butterfly)</option>
                <option value="halvorsen">Halvorsen (Twisted)</option>
                <option value="aizawa">Aizawa (Disc)</option>
                <option value="thomas">Thomas (Smooth)</option>
                <option value="sprott">Sprott B (Spiral)</option>
                <option value="rossler">Rössler (Fold)</option>
                <option value="dadras">Dadras (Flow)</option>
                <option value="galaxy">Galaxy (Classic)</option>
              </select>
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Nebula Scale</span>
                <span className={styles.settingsValue}>{config.nebulaScale.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="5"
                max="25"
                value={config.nebulaScale * 10}
                onChange={(e) => updateConfig('nebulaScale', Number(e.target.value) / 10)}
              />
            </div>
            
            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Radius</span>
                <span className={styles.settingsValue}>{config.sphereRadius}px</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="80"
                max="400"
                value={config.sphereRadius}
                onChange={(e) => updateConfig('sphereRadius', Number(e.target.value))}
              />
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Domain Separation</span>
                <span className={styles.settingsValue}>{config.domainSeparation}px</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="300"
                max="1500"
                value={config.domainSeparation}
                onChange={(e) => updateConfig('domainSeparation', Number(e.target.value))}
              />
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Card Offset</span>
                <span className={styles.settingsValue}>{config.cardOffset.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="100"
                max="250"
                value={config.cardOffset * 100}
                onChange={(e) => updateConfig('cardOffset', Number(e.target.value) / 100)}
              />
            </div>
          </div>

          {/* Animation Section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Animation</div>
            
            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Rotation Speed</span>
                <span className={styles.settingsValue}>{(config.rotationSpeed * 10000).toFixed(1)}</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="0"
                max="50"
                value={config.rotationSpeed * 10000}
                onChange={(e) => updateConfig('rotationSpeed', Number(e.target.value) / 10000)}
              />
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Connection Opacity</span>
                <span className={styles.settingsValue}>{config.connectionOpacity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className={styles.settingsSlider}
                min="0"
                max="100"
                value={config.connectionOpacity * 100}
                onChange={(e) => updateConfig('connectionOpacity', Number(e.target.value) / 100)}
              />
            </div>
          </div>

          {/* Background Effects Section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionTitle}>Background Effects</div>
            
            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Background Stars</span>
                <input
                  type="checkbox"
                  checked={config.showBackgroundStars}
                  onChange={(e) => updateConfig('showBackgroundStars', e.target.checked)}
                  style={{ accentColor: 'var(--gold, #CAA554)' }}
                />
              </label>
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Nebulae</span>
                <input
                  type="checkbox"
                  checked={config.showNebulae}
                  onChange={(e) => updateConfig('showNebulae', e.target.checked)}
                  style={{ accentColor: 'var(--gold, #CAA554)' }}
                />
              </label>
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Scan Lines</span>
                <input
                  type="checkbox"
                  checked={config.showScanLines}
                  onChange={(e) => updateConfig('showScanLines', e.target.checked)}
                  style={{ accentColor: 'var(--gold, #CAA554)' }}
                />
              </label>
            </div>

            <div className={styles.settingsRow}>
              <label className={styles.settingsLabel}>
                <span>Vignette</span>
                <input
                  type="checkbox"
                  checked={config.showVignette}
                  onChange={(e) => updateConfig('showVignette', e.target.checked)}
                  style={{ accentColor: 'var(--gold, #CAA554)' }}
                />
              </label>
            </div>
          </div>

          <button className={styles.resetButton} onClick={resetConfig}>
            Reset to Defaults
          </button>
        </div>
      )}
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
