/**
 * Shared Components - Particle Icon System
 * 
 * Two sigil systems:
 * 
 * 1. LEGACY GEOMETRIC (ParticleIcon, DomainSigil, EntityGlyph)
 *    Three-layer system: Domain polygon + Role modifier + Orbital elements
 *    Simple, clean, deterministic shapes
 * 
 * 2. GENERATIVE (GenerativeSigil) - RECOMMENDED
 *    Algorithmic particle clusters inspired by Grafana's pillar configs
 *    - Domain-specific "DNA" produces unique patterns
 *    - Entity variants inherit domain patterns with mutations
 *    - Subtle glitch offsets echo Thoughtform brand language
 *    - Uses golden ratio, fibonacci spirals, seeded randomness
 */

// ═══════════════════════════════════════════════════════════════════════════
// GENERATIVE SIGIL SYSTEM (Primary)
// ═══════════════════════════════════════════════════════════════════════════

export { GenerativeSigil, DOMAIN_DNA } from './GenerativeSigil';
export type { GenerativeSigilProps, DomainDNA, Particle } from './GenerativeSigil';

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY GEOMETRIC SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// Core renderer
export { ParticleIcon } from './ParticleIcon';
export type { 
  ParticleIconProps,
  DomainShapeType, 
  RoleModifierType, 
  OrbitalType 
} from './ParticleIcon';

// Domain sigils (primary layer)
export { 
  DomainSigil,
  getDomainColor,
  getDomainShape,
  getKnownDomains,
  DOMAIN_COLORS,
  DOMAIN_SHAPES,
} from './DomainSigil';
export type { DomainSigilProps } from './DomainSigil';

// Entity glyphs (all layers combined)
export { 
  EntityGlyph,
  getModifierForClass,
  getOrbitalForClass,
  getKnownRoles,
  ROLE_MODIFIERS,
  ENTITY_ORBITALS,
} from './EntityGlyph';
export type { EntityGlyphProps } from './EntityGlyph';

// Shape generators (for custom icons)
export {
  trianglePoints,
  squarePoints,
  pentagonPoints,
  hexagonPoints,
  centerDot,
  innerRing,
  crossAxis,
  diagonalAxis,
  cornerMarks,
  edgeMidpoints,
  bracketCorners,
  orbitalDots,
  radialSpokes,
  generateDomainShape,
  generateRoleModifier,
  generateOrbital,
} from './shapes';
export type { ShapePoint, ShapeParams } from './shapes';
