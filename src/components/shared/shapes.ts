/**
 * Thoughtform Geometric Shape Generators
 * 
 * Philosophy: "Thoughts to Form"
 * - All shapes are geometric/topological primitives
 * - Domain = Base polygon (unique, instantly recognizable)
 * - Role = Structural modifier (corners, edges, center)
 * - Entity = Orbital elements (surrounding points)
 * 
 * Shapes snap to GRID=3 for crisp pixel rendering.
 */

export interface ShapePoint {
  x: number;
  y: number;
  alpha?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN BASE SHAPES (Primary Layer)
// Each domain gets a unique, simple polygon
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Triangle - pointing up (Starhaven Reaches)
 * Represents: Ascension, direction, purpose
 */
export function trianglePoints(radius: number = 12): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2; // Start from top
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  // Connect back and add edge points
  const edgePoints = interpolateEdges(points, 4);
  return [...points, ...edgePoints];
}

/**
 * Square/Diamond (The Gradient Throne)
 * Represents: Stability, balance, foundation
 */
export function squarePoints(radius: number = 12, rotated: boolean = true): ShapePoint[] {
  const points: ShapePoint[] = [];
  const offset = rotated ? Math.PI / 4 : 0; // 45° rotation for diamond
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + offset;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 3);
  return [...points, ...edgePoints];
}

/**
 * Pentagon (The Lattice)
 * Represents: Pattern, structure, interconnection
 */
export function pentagonPoints(radius: number = 12): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 3);
  return [...points, ...edgePoints];
}

/**
 * Hexagon (The Threshold)
 * Represents: Gateway, boundary, transition
 */
export function hexagonPoints(radius: number = 12): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 2);
  return [...points, ...edgePoints];
}

/**
 * Interpolate points along polygon edges
 */
function interpolateEdges(vertices: ShapePoint[], pointsPerEdge: number): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];
    for (let j = 1; j <= pointsPerEdge; j++) {
      const t = j / (pointsPerEdge + 1);
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        alpha: 0.7,
      });
    }
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE MODIFIERS (Secondary Layer)
// Structural additions to the base shape
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Center point - marks the core
 */
export function centerDot(): ShapePoint[] {
  return [{ x: 0, y: 0, alpha: 1.0 }];
}

/**
 * Inner ring - smaller concentric shape
 */
export function innerRing(radius: number = 5, segments: number = 8): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 0.6,
    });
  }
  return points;
}

/**
 * Cross axis - vertical and horizontal lines through center
 */
export function crossAxis(size: number = 8): ShapePoint[] {
  const points: ShapePoint[] = [];
  const step = 3; // GRID
  for (let i = -size; i <= size; i += step) {
    if (i !== 0) {
      points.push({ x: i, y: 0, alpha: 0.7 });
      points.push({ x: 0, y: i, alpha: 0.7 });
    }
  }
  return points;
}

/**
 * Diagonal axis - X through center
 */
export function diagonalAxis(size: number = 8): ShapePoint[] {
  const points: ShapePoint[] = [];
  const step = 3;
  for (let i = -size; i <= size; i += step) {
    if (i !== 0) {
      points.push({ x: i, y: i, alpha: 0.7 });
      points.push({ x: i, y: -i, alpha: 0.7 });
    }
  }
  return points;
}

/**
 * Corner marks - small indicators at vertices
 */
export function cornerMarks(radius: number = 10, count: number = 4): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    // Mark slightly inside the vertex
    points.push({
      x: Math.cos(angle) * radius * 0.6,
      y: Math.sin(angle) * radius * 0.6,
      alpha: 0.8,
    });
  }
  return points;
}

/**
 * Edge midpoints - marks at center of each edge
 */
export function edgeMidpoints(radius: number = 10, count: number = 4): ShapePoint[] {
  const points: ShapePoint[] = [];
  const offset = Math.PI / count; // Rotate to hit edges, not vertices
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + offset;
    points.push({
      x: Math.cos(angle) * radius * 0.7,
      y: Math.sin(angle) * radius * 0.7,
      alpha: 0.8,
    });
  }
  return points;
}

/**
 * Bracket corners - small L-shapes at corners (Architect)
 */
export function bracketCorners(size: number = 10): ShapePoint[] {
  const points: ShapePoint[] = [];
  const len = 4;
  const positions = [
    { x: -1, y: -1 }, // top-left
    { x: 1, y: -1 },  // top-right
    { x: -1, y: 1 },  // bottom-left
    { x: 1, y: 1 },   // bottom-right
  ];
  
  positions.forEach(({ x: dx, y: dy }) => {
    const cx = dx * size * 0.8;
    const cy = dy * size * 0.8;
    // Horizontal arm
    points.push({ x: cx, y: cy, alpha: 0.9 });
    points.push({ x: cx - dx * len, y: cy, alpha: 0.9 });
    // Vertical arm
    points.push({ x: cx, y: cy - dy * len, alpha: 0.9 });
  });
  
  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORBITAL ELEMENTS (Tertiary Layer - Entity specific)
// Small points that orbit/surround the main shape
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Orbital dots - small points at regular intervals around the shape
 */
export function orbitalDots(radius: number = 14, count: number = 3, offset: number = 0): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + offset;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 0.5,
    });
  }
  return points;
}

/**
 * Radial spokes - lines extending outward from center
 */
export function radialSpokes(innerRadius: number = 10, outerRadius: number = 14, count: number = 4): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    // Inner point
    points.push({
      x: Math.cos(angle) * innerRadius,
      y: Math.sin(angle) * innerRadius,
      alpha: 0.6,
    });
    // Outer point
    points.push({
      x: Math.cos(angle) * outerRadius,
      y: Math.sin(angle) * outerRadius,
      alpha: 0.4,
    });
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type DomainShapeType = 'triangle' | 'square' | 'pentagon' | 'hexagon';
export type RoleModifierType = 'none' | 'center' | 'inner-ring' | 'cross' | 'diagonal' | 'corners' | 'edges' | 'brackets';
export type OrbitalType = 'none' | 'dots-3' | 'dots-4' | 'dots-6' | 'spokes';

export interface ShapeParams {
  radius?: number;
  rotated?: boolean;
  segments?: number;
  count?: number;
  offset?: number;
  innerRadius?: number;
  outerRadius?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPATCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function generateDomainShape(shape: DomainShapeType, radius: number = 12): ShapePoint[] {
  switch (shape) {
    case 'triangle':
      return trianglePoints(radius);
    case 'square':
      return squarePoints(radius, true);
    case 'pentagon':
      return pentagonPoints(radius);
    case 'hexagon':
      return hexagonPoints(radius);
    default:
      return squarePoints(radius, true);
  }
}

export function generateRoleModifier(modifier: RoleModifierType, radius: number = 10): ShapePoint[] {
  switch (modifier) {
    case 'none':
      return [];
    case 'center':
      return centerDot();
    case 'inner-ring':
      return innerRing(radius * 0.4);
    case 'cross':
      return crossAxis(radius * 0.6);
    case 'diagonal':
      return diagonalAxis(radius * 0.6);
    case 'corners':
      return cornerMarks(radius, 4);
    case 'edges':
      return edgeMidpoints(radius, 4);
    case 'brackets':
      return bracketCorners(radius);
    default:
      return [];
  }
}

export function generateOrbital(orbital: OrbitalType, radius: number = 14): ShapePoint[] {
  switch (orbital) {
    case 'none':
      return [];
    case 'dots-3':
      return orbitalDots(radius, 3);
    case 'dots-4':
      return orbitalDots(radius, 4, Math.PI / 4);
    case 'dots-6':
      return orbitalDots(radius, 6);
    case 'spokes':
      return radialSpokes(radius * 0.7, radius);
    default:
      return [];
  }
}
