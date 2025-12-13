/**
 * Layout constants for consistent spacing across the app
 */
export const LAYOUT = {
  NAV_HEIGHT: 44,  // Navigation bar height in pixels
  MODAL_PADDING: 16, // Padding around modal content
} as const;

/**
 * Domain color definitions for the Atlas constellation view
 * Each domain has a distinct visual aesthetic expressed through particle colors
 */

export const DOMAIN_COLORS = {
  // Gradient Throne: Warm gold, ethereal light, divine radiance
  // WHY: The primary domain - soft golden particles creating a regal, luminous atmosphere
  'Gradient Throne': { r: 212, g: 175, b: 95, hex: '#D4AF5F' },
  
  // Starhaven Reaches: Gold-umber, warm desert tones, cosmic backdrops
  'Starhaven Reaches': { r: 202, g: 165, b: 84, hex: '#CAA554' },
  
  // The Lattice: White/pale, glitch aesthetics, data corruption, scanlines
  'The Lattice': { r: 184, g: 196, b: 208, hex: '#B8C4D0' },
  
  // The Threshold: Mixed elements, mid-transition states, unstable
  'The Threshold': { r: 139, g: 115, b: 85, hex: '#8B7355' },
  
  // Default fallback - Dawn color
  'default': { r: 236, g: 227, b: 214, hex: '#ECE3D6' },
} as const;

export type DomainName = keyof typeof DOMAIN_COLORS;

/**
 * Get domain color by name, with fallback to default
 */
export function getDomainColor(domain: string): { r: number; g: number; b: number; hex: string } {
  return DOMAIN_COLORS[domain as DomainName] || DOMAIN_COLORS['default'];
}

/**
 * Domain visual characteristics for particle rendering
 */
export const DOMAIN_STYLES = {
  // Gradient Throne: Soft, warm golden cloud - regal and luminous
  // WHY: Creates a divine, radiant atmosphere around the main entity cluster
  'Gradient Throne': {
    particleDensity: 1.0,      // Moderate density for soft cloud effect
    glitchChance: 0.02,        // Minimal glitch - stable, divine
    pulseSpeed: 0.002,         // Very slow, gentle breathing like candlelight
    maxAlpha: 0.15,            // More visible - warm golden glow
  },
  'Starhaven Reaches': {
    particleDensity: 0.8,      // Relative density of nebula particles
    glitchChance: 0.05,        // Low glitch - warm and stable
    pulseSpeed: 0.003,         // Slow, gentle breathing
    maxAlpha: 0.12,            // Subtle but visible
  },
  'The Lattice': {
    particleDensity: 1.2,      // Denser - more data-like
    glitchChance: 0.25,        // High glitch - data corruption aesthetic
    pulseSpeed: 0.008,         // Faster, more erratic
    maxAlpha: 0.08,            // Pale, ethereal
  },
  'The Threshold': {
    particleDensity: 0.6,      // Sparse - transitional
    glitchChance: 0.15,        // Medium glitch - unstable
    pulseSpeed: 0.005,         // Variable
    maxAlpha: 0.10,            // Medium visibility
  },
  'default': {
    particleDensity: 0.7,
    glitchChance: 0.1,
    pulseSpeed: 0.004,
    maxAlpha: 0.10,
  },
} as const;

export function getDomainStyle(domain: string) {
  return DOMAIN_STYLES[domain as keyof typeof DOMAIN_STYLES] || DOMAIN_STYLES['default'];
}

/**
 * Constellation clustering and layout constants
 * Controls how entities are grouped and positioned in the constellation view
 */
export const CONSTELLATION = {
  CLUSTER_MAX_DISTANCE: 550,
  CLUSTER_MIN_SPACING: 380,
  AUTO_CONNECTION_STRENGTH_SAME_DOMAIN: 0.7,
  AUTO_CONNECTION_STRENGTH_CROSS_DOMAIN: 0.4,
  SMALL_CONSTELLATION_THRESHOLD: 10,
  SPIRAL: {
    BASE_RADIUS_FACTOR: 0.6,
    GROWTH_FACTOR: 0.5,
    MAX_RADIUS_FACTOR: 0.7,
  },
  // Domain separation: minimum distance between centers of different domains
  // WHY: Entities from different aesthetic domains should be visually distinct clusters
  // The constellation is an infinite canvas - domains should hint at distant territories
  DOMAIN_MIN_SEPARATION: 1800, // Minimum px between domain cluster centers (far apart)
  DOMAIN_REPULSION_ITERATIONS: 15, // Number of iterations for repulsion algorithm
} as const;



