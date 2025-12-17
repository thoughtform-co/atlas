'use client';

/**
 * DomainSigil - Domain-specific geometric icons
 * 
 * Each domain has a unique base polygon:
 * - Starhaven Reaches: Triangle (ascension, direction)
 * - The Gradient Throne: Diamond/Square (stability, balance)
 * - The Lattice: Pentagon (pattern, structure)
 * - The Threshold: Hexagon (gateway, boundary)
 * 
 * These are the primary layer of the sigil system.
 */

import { ParticleIcon, DomainShapeType } from './ParticleIcon';

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN COLOR PALETTE (RGB triplets)
// ═══════════════════════════════════════════════════════════════════════════

export const DOMAIN_COLORS: Record<string, string> = {
  'Starhaven Reaches': '202, 165, 84',    // Gold
  'The Gradient Throne': '180, 200, 200', // Silver-white
  'The Lattice': '184, 196, 208',         // Blue-white
  'The Threshold': '139, 115, 85',        // Amber
  'default': '236, 227, 214',             // Dawn (fallback)
};

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN SHAPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export const DOMAIN_SHAPES: Record<string, DomainShapeType> = {
  'Starhaven Reaches': 'triangle',
  'The Gradient Throne': 'square',
  'The Lattice': 'pentagon',
  'The Threshold': 'hexagon',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface DomainSigilProps {
  /** Domain name (e.g., "Starhaven Reaches") */
  domain: string;
  /** Icon size in pixels (18-30 recommended) */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Custom opacity */
  opacity?: number;
}

/**
 * Render a domain's unique sigil (base shape only)
 */
export function DomainSigil({
  domain,
  size = 24,
  className = '',
  opacity = 1,
}: DomainSigilProps) {
  const shape = DOMAIN_SHAPES[domain] || 'square';
  const color = DOMAIN_COLORS[domain] || DOMAIN_COLORS['default'];

  return (
    <ParticleIcon
      domain={shape}
      color={color}
      size={size}
      className={className}
      opacity={opacity}
    />
  );
}

/**
 * Get the color for a domain
 */
export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || DOMAIN_COLORS['default'];
}

/**
 * Get the shape for a domain
 */
export function getDomainShape(domain: string): DomainShapeType {
  return DOMAIN_SHAPES[domain] || 'square';
}

/**
 * List all known domains
 */
export function getKnownDomains(): string[] {
  return Object.keys(DOMAIN_SHAPES);
}
