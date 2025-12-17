'use client';

/**
 * ParticleIcon - Geometric Particle Icon Renderer
 * 
 * Three-layer system:
 * 1. Domain Shape (base polygon)
 * 2. Role Modifier (structural overlay)
 * 3. Orbital Elements (surrounding points)
 * 
 * All coordinates snap to GRID=3 for crisp pixel rendering.
 */

import { useMemo } from 'react';
import {
  ShapePoint,
  DomainShapeType,
  RoleModifierType,
  OrbitalType,
  generateDomainShape,
  generateRoleModifier,
  generateOrbital,
} from './shapes';

// Sacred constant: all icons snap to 3px grid
const GRID = 3;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ParticleIconProps {
  /** Base domain shape */
  domain: DomainShapeType;
  /** Role modifier overlay */
  role?: RoleModifierType;
  /** Orbital elements */
  orbital?: OrbitalType;
  /** Color as RGB triplet string (e.g., "202, 165, 84") */
  color: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS class */
  className?: string;
  /** Overall opacity */
  opacity?: number;
}

interface PixelData {
  gx: number;
  gy: number;
  alpha: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Snap coordinate to grid
 */
function snapToGrid(value: number, center: number): number {
  return Math.floor((value + center) / GRID) * GRID;
}

/**
 * Deduplicate pixels, keeping highest alpha for overlapping positions
 */
function deduplicatePixels(pixels: PixelData[]): PixelData[] {
  const map = new Map<string, PixelData>();
  
  for (const pixel of pixels) {
    const key = `${pixel.gx},${pixel.gy}`;
    const existing = map.get(key);
    if (!existing || pixel.alpha > existing.alpha) {
      map.set(key, pixel);
    }
  }
  
  return Array.from(map.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ParticleIcon({
  domain,
  role = 'none',
  orbital = 'none',
  color,
  size = 24,
  className = '',
  opacity = 1,
}: ParticleIconProps) {
  const pixels = useMemo(() => {
    const center = size / 2;
    const radius = size / 2 - 3; // Leave 3px padding
    
    // Generate all three layers
    const domainPoints = generateDomainShape(domain, radius);
    const rolePoints = generateRoleModifier(role, radius);
    const orbitalPoints = generateOrbital(orbital, radius * 1.1);
    
    // Combine all points
    const allPoints: ShapePoint[] = [...domainPoints, ...rolePoints, ...orbitalPoints];
    
    // Convert to grid-snapped pixels
    const rawPixels: PixelData[] = allPoints.map((point) => ({
      gx: snapToGrid(point.x, center),
      gy: snapToGrid(point.y, center),
      alpha: (point.alpha ?? 0.9) * opacity,
    }));
    
    return deduplicatePixels(rawPixels);
  }, [domain, role, orbital, size, opacity]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{
        imageRendering: 'pixelated',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      aria-hidden="true"
    >
      {pixels.map((pixel, i) => (
        <rect
          key={`${pixel.gx}-${pixel.gy}-${i}`}
          x={pixel.gx}
          y={pixel.gy}
          width={GRID - 1}
          height={GRID - 1}
          fill={`rgba(${color}, ${pixel.alpha})`}
        />
      ))}
    </svg>
  );
}

// Re-export types for external use
export type { DomainShapeType, RoleModifierType, OrbitalType };
