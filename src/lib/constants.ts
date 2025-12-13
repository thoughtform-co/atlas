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
  // Gradient Throne: Grey/white ethereal mist - dark, mysterious entities
  // WHY: Subtle grey particles that complement the dark, otherworldly aesthetic
  'Gradient Throne': { r: 180, g: 175, b: 168, hex: '#B4AFA8' },
  
  // Starhaven Reaches: Warm gold, desert sands, cosmic warmth
  // WHY: Rich golden particles for entities with warm, luminous aesthetic
  'Starhaven Reaches': { r: 218, g: 175, b: 85, hex: '#DAAF55' },
  
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
 * WHY: Each domain has a distinct particle nebula surrounding its entities
 */
export const DOMAIN_STYLES = {
  // Gradient Throne: Subtle grey mist - mysterious, ethereal
  // WHY: Complements the dark, otherworldly entities without overpowering them
  'Gradient Throne': {
    particleDensity: 2.0,      // Moderate density
    glitchChance: 0.03,        // Minimal glitch - stable
    pulseSpeed: 0.002,         // Very slow, gentle breathing
    maxAlpha: 0.25,            // Subtle grey mist
  },
  // Starhaven Reaches: Rich golden cloud - warm, luminous, inviting
  // WHY: Strong golden particles for the warm desert/cosmic aesthetic
  'Starhaven Reaches': {
    particleDensity: 3.0,      // Dense golden cloud
    glitchChance: 0.02,        // Very stable - warm and welcoming
    pulseSpeed: 0.0025,        // Slow, warm breathing like sunlight
    maxAlpha: 0.45,            // Very visible golden glow
  },
  'The Lattice': {
    particleDensity: 2.5,      // Denser - more data-like
    glitchChance: 0.25,        // High glitch - data corruption aesthetic
    pulseSpeed: 0.008,         // Faster, more erratic
    maxAlpha: 0.20,            // Pale, ethereal
  },
  'The Threshold': {
    particleDensity: 1.5,      // Medium - transitional
    glitchChance: 0.15,        // Medium glitch - unstable
    pulseSpeed: 0.005,         // Variable
    maxAlpha: 0.25,            // Medium visibility
  },
  'default': {
    particleDensity: 2.0,      // Visible default
    glitchChance: 0.1,
    pulseSpeed: 0.004,
    maxAlpha: 0.25,
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
  // Connection strength for auto-generated connections within same domain
  AUTO_CONNECTION_STRENGTH_SAME_DOMAIN: 0.7,
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



