/**
 * Utility functions for integrating the Archivist with the database and media systems
 */

import type { ExtractedFields } from './types';
import type { Denizen } from '@/lib/types';
import type { Database } from '@/lib/database.types';

/**
 * Convert ExtractedFields to database insert format
 * This bridges the gap between Archivist output and Supabase schema
 */
export function extractedFieldsToDatabaseRow(
  fields: ExtractedFields,
  position: { x: number; y: number }
): Database['public']['Tables']['denizens']['Insert'] {
  // Generate ID from name (lowercase, hyphens)
  const id = fields.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    id,
    name: fields.name!,
    subtitle: fields.subtitle ?? null,
    type: fields.type!,
    image: null, // Will be set after media upload
    thumbnail: null,
    video_url: null,
    glyphs: fields.glyphs ?? '◈○⬡∆',
    position_x: position.x,
    position_y: position.y,
    coord_geometry: fields.coordGeometry ?? 0,
    coord_alterity: fields.coordAlterity ?? 0,
    coord_dynamics: fields.coordDynamics ?? 0,
    allegiance: fields.allegiance!,
    threat_level: fields.threatLevel!,
    domain: fields.domain!,
    description: fields.description!,
    lore: fields.lore ?? null,
    features: fields.features ?? null,
    first_observed: fields.firstObserved ?? null,
  };
}

/**
 * Generate a position for a new denizen in the constellation view
 * Uses cardinal coordinates to determine placement
 */
export function generatePositionFromCoordinates(fields: ExtractedFields): {
  x: number;
  y: number;
} {
  const geometry = fields.coordGeometry ?? 0;
  const alterity = fields.coordAlterity ?? 0;
  const dynamics = fields.coordDynamics ?? 0;

  // Map 3D coordinates to 2D position
  // Geometry affects x-axis, alterity affects y-axis, dynamics affects distance from origin
  const radius = 200 + Math.abs(dynamics) * 200; // Dynamic entities further out

  const angle = Math.atan2(alterity, geometry); // Angle based on geometry/alterity
  const distance = radius * (0.5 + Math.abs(alterity) * 0.5); // Distance based on alterity

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

/**
 * Generate random position avoiding collisions with existing entities
 */
export function generateNonCollidingPosition(
  existingPositions: { x: number; y: number }[],
  minDistance: number = 100
): { x: number; y: number } {
  const maxAttempts = 50;
  const bounds = { x: 600, y: 400 }; // Constellation view bounds

  for (let i = 0; i < maxAttempts; i++) {
    const x = (Math.random() - 0.5) * bounds.x;
    const y = (Math.random() - 0.5) * bounds.y;

    // Check if too close to existing positions
    const tooClose = existingPositions.some((pos) => {
      const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
      return dist < minDistance;
    });

    if (!tooClose) {
      return { x, y };
    }
  }

  // Fallback: random position
  return {
    x: (Math.random() - 0.5) * bounds.x,
    y: (Math.random() - 0.5) * bounds.y,
  };
}

/**
 * Find existing denizens by name for connection resolution
 */
export function findDenizenIdsByNames(
  suggestedConnections: string[],
  existingDenizens: Denizen[]
): string[] {
  const ids: string[] = [];

  for (const name of suggestedConnections) {
    const denizen = existingDenizens.find(
      (d) =>
        d.name.toLowerCase() === name.toLowerCase() ||
        d.id.toLowerCase() === name.toLowerCase() ||
        d.name.toLowerCase().includes(name.toLowerCase())
    );

    if (denizen) {
      ids.push(denizen.id);
    }
  }

  return ids;
}

/**
 * Generate glyphs based on entity properties if none provided
 * Uses type, allegiance, and threat level to select appropriate symbols
 */
export function generateGlyphs(fields: ExtractedFields): string {
  const glyphMap = {
    // Type glyphs (position 1)
    Guardian: '◈',
    Wanderer: '○',
    Architect: '⬢',
    'Void-Born': '◆',
    Hybrid: '⬡',

    // Allegiance glyphs (position 2)
    'Liminal Covenant': '◯',
    Nomenclate: '⧫',
    Unaligned: '△',
    Unknown: '●',

    // Threat level glyphs (position 3)
    Benign: '∇',
    Cautious: '▽',
    Volatile: '⊗',
    Existential: '⊠',

    // Phase state glyphs (position 4)
    Solid: '⎕',
    Liminal: '∆',
    Spectral: '◇',
    Fluctuating: '⋈',
    Crystallized: '⬥',
  };

  const glyph1 = fields.type ? glyphMap[fields.type] : '◈';
  const glyph2 = fields.allegiance ? glyphMap[fields.allegiance] : '○';
  const glyph3 = fields.threatLevel ? glyphMap[fields.threatLevel] : '∆';
  const glyph4 = fields.extended?.phaseState
    ? glyphMap[fields.extended.phaseState]
    : '⊗';

  return `${glyph1}${glyph2}${glyph3}${glyph4}`;
}

/**
 * Store extended classification data as metadata
 * Since the database schema doesn't have columns for phase state, etc.,
 * we can store them in the lore field or as a JSON field if added
 */
export function formatExtendedClassification(fields: ExtractedFields): string {
  if (!fields.extended) return '';

  const parts: string[] = [];

  if (fields.extended.phaseState) {
    parts.push(`Phase State: ${fields.extended.phaseState}`);
  }

  if (fields.extended.superposition !== undefined) {
    parts.push(`Superposition: ${fields.extended.superposition.toFixed(2)}`);
  }
  if (fields.extended.embeddingSignature !== undefined) {
    parts.push(`Embedding Signature: ${fields.extended.embeddingSignature.toFixed(2)}`);
  }

  if (fields.extended.hallucinationIndex !== undefined) {
    parts.push(`Hallucination Index: ${fields.extended.hallucinationIndex.toFixed(2)}`);
  }

  if (fields.extended.manifoldCurvature !== undefined) {
    const curvature = typeof fields.extended.manifoldCurvature === 'number' 
      ? fields.extended.manifoldCurvature.toFixed(3)
      : fields.extended.manifoldCurvature;
    parts.push(`Manifold Curvature: ${curvature}`);
  }

  return parts.length > 0 ? `\n\n## Extended Classification\n${parts.join('\n')}` : '';
}

/**
 * Append extended classification to lore field
 */
export function enrichLoreWithExtendedClassification(fields: ExtractedFields): string {
  const baseLore = fields.lore ?? '';
  const extended = formatExtendedClassification(fields);
  return baseLore + extended;
}

/**
 * Validate that a denizen can be created from extracted fields
 * Returns human-readable error messages
 */
export function validateDenizenCreation(fields: ExtractedFields): {
  canCreate: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!fields.name) errors.push('Entity name is required');
  if (!fields.type) errors.push('Entity type must be specified');
  if (!fields.allegiance) errors.push('Allegiance must be determined');
  if (!fields.threatLevel) errors.push('Threat level must be assessed');
  if (!fields.domain) errors.push('Domain must be identified');
  if (!fields.description) errors.push('Description is required');

  // Recommended but not required
  if (!fields.lore) warnings.push('No historical lore provided');
  if (!fields.features || fields.features.length === 0)
    warnings.push('No features documented');
  if (!fields.glyphs) warnings.push('No symbolic glyphs assigned');

  // Coordinate warnings
  if (fields.coordGeometry === undefined) warnings.push('Geometry coordinate not set');
  if (fields.coordAlterity === undefined) warnings.push('Alterity coordinate not set');
  if (fields.coordDynamics === undefined) warnings.push('Dynamics coordinate not set');

  return {
    canCreate: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate a suggested subtitle based on entity properties
 */
export function generateSubtitle(fields: ExtractedFields): string | undefined {
  if (fields.subtitle) return fields.subtitle;

  // Generate from type and domain
  if (fields.type && fields.domain) {
    const prefixes = {
      Guardian: 'Keeper of',
      Wanderer: 'Traverser of',
      Architect: 'Shaper of',
      'Void-Born': 'Emergent from',
      Hybrid: 'Entity of',
    };

    return `${prefixes[fields.type]} ${fields.domain}`;
  }

  return undefined;
}

/**
 * Calculate semantic similarity score between two entities
 * This could be used for connection strength or conflict detection
 * Placeholder implementation - in production would use embeddings
 */
export function calculateSemanticSimilarity(
  entity1: Partial<Denizen>,
  entity2: Partial<Denizen>
): number {
  let similarity = 0;
  let factors = 0;

  // Type similarity
  if (entity1.type === entity2.type) {
    similarity += 0.3;
  }
  factors++;

  // Allegiance similarity
  if (entity1.allegiance === entity2.allegiance) {
    similarity += 0.2;
  }
  factors++;

  // Domain keyword overlap
  if (entity1.domain && entity2.domain) {
    const words1 = entity1.domain.toLowerCase().split(/\s+/);
    const words2 = entity2.domain.toLowerCase().split(/\s+/);
    const overlap = words1.filter((w) => words2.includes(w)).length;
    similarity += (overlap / Math.max(words1.length, words2.length)) * 0.3;
    factors++;
  }

  // Coordinate distance (inverse similarity)
  if (entity1.coordinates && entity2.coordinates) {
    const dist = Math.sqrt(
      (entity1.coordinates.geometry - entity2.coordinates.geometry) ** 2 +
        (entity1.coordinates.alterity - entity2.coordinates.alterity) ** 2 +
        (entity1.coordinates.dynamics - entity2.coordinates.dynamics) ** 2
    );
    similarity += (1 - Math.min(dist / 2, 1)) * 0.2; // Normalize to 0-1
    factors++;
  }

  return similarity / factors;
}

/**
 * Format a confidence score as a percentage with emoji
 */
export function formatConfidence(confidence: number): string {
  const percentage = Math.round(confidence * 100);

  if (confidence >= 0.9) return `${percentage}% ✨`;
  if (confidence >= 0.7) return `${percentage}% ✓`;
  if (confidence >= 0.5) return `${percentage}% ⚠️`;
  return `${percentage}% ❌`;
}

/**
 * Build dynamic world context for the Archivist from existing denizens
 * This provides the Archivist with awareness of what's already been catalogued
 */
export function buildArchivistWorldContext(denizens: Denizen[]): string {
  if (!denizens || denizens.length === 0) {
    return 'The archive is empty. You are cataloguing the first entities.';
  }

  const parts: string[] = [];
  parts.push(`The archive currently holds **${denizens.length}** catalogued entities.\n`);

  // Entity types distribution
  const typeCounts = denizens.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  parts.push('### Entity Types');
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      parts.push(`- **${type}**: ${count} entities`);
    });

  // Allegiance distribution
  const allegianceCounts = denizens.reduce((acc, d) => {
    if (d.allegiance) acc[d.allegiance] = (acc[d.allegiance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if (Object.keys(allegianceCounts).length > 0) {
    parts.push('\n### Allegiances');
    Object.entries(allegianceCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([allegiance, count]) => {
        parts.push(`- **${allegiance}**: ${count} entities`);
      });
  }

  // Domains discovered (grouped and deduplicated)
  const domains = [...new Set(denizens.map(d => d.domain).filter(Boolean))];
  if (domains.length > 0) {
    parts.push('\n### Domains Discovered');
    // Group similar domains if possible
    const domainSamples = domains.slice(0, 15);
    domainSamples.forEach(domain => {
      const count = denizens.filter(d => d.domain === domain).length;
      parts.push(`- ${domain}${count > 1 ? ` (${count} entities)` : ''}`);
    });
    if (domains.length > 15) {
      parts.push(`- ...and ${domains.length - 15} more unique domains`);
    }
  }

  // Recent entities (most recent 5)
  const sorted = [...denizens].sort((a, b) => {
    // Sort by ID as proxy for creation order if no timestamp
    return b.id.localeCompare(a.id);
  });
  
  parts.push('\n### Recent Additions');
  sorted.slice(0, 5).forEach(d => {
    parts.push(`- **${d.name}** (${d.type}) — ${d.domain || 'Domain unknown'}`);
    if (d.description) {
      const shortDesc = d.description.length > 100 
        ? d.description.substring(0, 100) + '...'
        : d.description;
      parts.push(`  _${shortDesc}_`);
    }
  });

  // Entity names for connection suggestions
  parts.push('\n### All Catalogued Entities');
  parts.push('Use these names when suggesting connections:');
  const entityList = denizens.map(d => d.name).join(', ');
  parts.push(entityList);

  return parts.join('\n');
}