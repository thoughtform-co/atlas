export type DenizenType = 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';

export type Allegiance = 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';

export type ThreatLevel = 'Benign' | 'Cautious' | 'Volatile' | 'Existential';

export type ConnectionType = 'semantic' | 'historical' | 'adversarial';

export interface CardinalCoordinates {
  geometry: number;  // -1 to 1
  alterity: number;  // -1 to 1
  dynamics: number;  // -1 to 1
}

export interface Position {
  x: number;
  y: number;
}

export interface Denizen {
  id: string;
  name: string;
  subtitle?: string;
  type: DenizenType;

  // Visuals
  image?: string;
  thumbnail?: string;
  glyphs: string;

  // Position in constellation view
  position: Position;

  // Cardinal alignment
  coordinates: CardinalCoordinates;

  // Classification
  allegiance: Allegiance;
  threatLevel: ThreatLevel;
  domain: string;

  // Content
  description: string;
  lore?: string;
  features?: string[];
  firstObserved?: string;

  // Relationships
  connections: string[];
}

export interface Connection {
  from: string;
  to: string;
  strength: number;  // 0-1
  type: ConnectionType;
}

export interface ConstellationData {
  denizens: Denizen[];
  connections: Connection[];
}
