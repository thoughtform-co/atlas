'use client';

/**
 * EntityGlyph - Entity-specific layered icons
 * 
 * Three-layer system:
 * 1. Domain = Base shape (triangle, square, pentagon, hexagon)
 * 2. Role = Structural modifier (center, cross, corners, etc.)
 * 3. Entity = Orbital elements (surrounding dots)
 * 
 * This creates a visual hierarchy where each entity is unique
 * but clearly belongs to its domain family.
 */

import { ParticleIcon, DomainShapeType, RoleModifierType, OrbitalType } from './ParticleIcon';
import { DOMAIN_SHAPES, DOMAIN_COLORS } from './DomainSigil';

// ═══════════════════════════════════════════════════════════════════════════
// ROLE TO MODIFIER MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export const ROLE_MODIFIERS: Record<string, RoleModifierType> = {
  // Core roles
  'Herald': 'center',
  'Observer': 'center',
  
  // Structure roles
  'Keeper': 'inner-ring',
  'Pattern-Keeper': 'inner-ring',
  'Guardian': 'inner-ring',
  
  // Axis roles
  'Weaver': 'cross',
  'Thread-Weaver': 'cross',
  'Eigensage': 'cross',
  
  // Diagonal roles
  'Voidwalker': 'diagonal',
  'Nullbringer': 'diagonal',
  'Fatebinder': 'diagonal',
  
  // Corner roles
  'Seeker': 'corners',
  'Wanderer': 'corners',
  'Tideshaper': 'corners',
  
  // Edge roles
  'Signal-Speaker': 'edges',
  'Eonprism': 'edges',
  'Lightwarden': 'edges',
  
  // Frame roles
  'Architect': 'brackets',
  'Algoraph': 'brackets',
  
  // Default
  'default': 'none',
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY ORBITAL MAPPING (optional tertiary layer)
// ═══════════════════════════════════════════════════════════════════════════

export const ENTITY_ORBITALS: Record<string, OrbitalType> = {
  // Entities with orbital dots
  'Herald': 'dots-3',
  'Voidwalker': 'dots-4',
  'Architect': 'dots-4',
  'Eonprism': 'dots-6',
  
  // Entities with spokes
  'Eigensage': 'spokes',
  'Algoraph': 'spokes',
  
  'default': 'none',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface EntityGlyphProps {
  /** Entity's domain (e.g., "Starhaven Reaches") */
  domain: string;
  /** Entity's class/role (e.g., "Herald", "Architect") */
  entityClass?: string;
  /** Whether to include orbital elements */
  showOrbital?: boolean;
  /** Icon size in pixels (18-30 recommended) */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Custom opacity */
  opacity?: number;
  /** Override the automatic role modifier */
  role?: RoleModifierType;
  /** Override the automatic orbital */
  orbital?: OrbitalType;
}

/**
 * Render an entity's complete glyph (domain + role + orbital)
 */
export function EntityGlyph({
  domain,
  entityClass,
  showOrbital = false,
  size = 24,
  className = '',
  opacity = 1,
  role: overrideRole,
  orbital: overrideOrbital,
}: EntityGlyphProps) {
  // Get domain shape and color
  const shape: DomainShapeType = DOMAIN_SHAPES[domain] || 'square';
  const color = DOMAIN_COLORS[domain] || DOMAIN_COLORS['default'];
  
  // Determine role modifier
  const roleModifier = overrideRole ?? getModifierForClass(entityClass);
  
  // Determine orbital (only if showOrbital is true or override provided)
  const orbitalType = overrideOrbital ?? (showOrbital ? getOrbitalForClass(entityClass) : 'none');

  return (
    <ParticleIcon
      domain={shape}
      role={roleModifier}
      orbital={orbitalType}
      color={color}
      size={size}
      className={className}
      opacity={opacity}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the role modifier for an entity class
 */
export function getModifierForClass(entityClass?: string): RoleModifierType {
  if (!entityClass) return 'none';
  
  // Direct match
  if (ROLE_MODIFIERS[entityClass]) {
    return ROLE_MODIFIERS[entityClass];
  }
  
  // Partial match (e.g., "Vector Architect" matches "Architect")
  for (const [role, modifier] of Object.entries(ROLE_MODIFIERS)) {
    if (role !== 'default' && entityClass.toLowerCase().includes(role.toLowerCase())) {
      return modifier;
    }
  }
  
  return 'none';
}

/**
 * Get the orbital type for an entity class
 */
export function getOrbitalForClass(entityClass?: string): OrbitalType {
  if (!entityClass) return 'none';
  
  // Direct match
  if (ENTITY_ORBITALS[entityClass]) {
    return ENTITY_ORBITALS[entityClass];
  }
  
  // Partial match
  for (const [role, orbital] of Object.entries(ENTITY_ORBITALS)) {
    if (role !== 'default' && entityClass.toLowerCase().includes(role.toLowerCase())) {
      return orbital;
    }
  }
  
  return 'none';
}

/**
 * Get all known role modifiers
 */
export function getKnownRoles(): string[] {
  return Object.keys(ROLE_MODIFIERS).filter(r => r !== 'default');
}
