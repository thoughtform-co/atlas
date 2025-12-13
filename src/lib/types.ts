export type DenizenType = 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';

export type Allegiance = 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';

export type ThreatLevel = 'Benign' | 'Cautious' | 'Volatile' | 'Existential';

export type ConnectionType = 'semantic' | 'historical' | 'adversarial';

export type PhaseState = 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized';

export type ArchiveEntryType =
  | 'entity_created'
  | 'entity_updated'
  | 'relationship_formed'
  | 'lore_added'
  | 'consistency_check'
  | 'anomaly_detected'
  | 'metadata_enriched';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface SuperpositionState {
  state: string;
  probability: number;
}

export interface MetaphysicalProperties {
  phaseState?: PhaseState;
  superposition?: SuperpositionState[];
  hallucinationIndex?: number;  // 0.00 to 1.00
  latentPosition?: number[];  // Vector embedding
  manifoldCurvature?: number;
  embeddingSignature?: number[];  // Alternative vector embedding
}

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
  type: DenizenType;  // Keep for backward compatibility (Guardian/Wanderer/etc)

  // Entity classification (new system)
  entityClass?: string;  // Entity class name (e.g., "Eigensage", "Nullseer")
  /** @deprecated No longer used in UI - kept for backward compatibility */
  entityName?: string;   // Individual entity name (e.g., "Vince")

  // Visuals
  image?: string;
  thumbnail?: string;
  videoUrl?: string;
  /** @deprecated No longer used in UI - kept for backward compatibility */
  glyphs: string;

  // Position in constellation view
  position: Position;

  // Cardinal alignment
  coordinates: CardinalCoordinates;

  // Classification
  allegiance: Allegiance;
  /** @deprecated No longer used in UI - kept for backward compatibility */
  threatLevel: ThreatLevel;
  domain: string;

  // Content
  description: string;
  /** @deprecated No longer used in UI - kept for backward compatibility */
  lore?: string;
  features?: string[];  // Note: Form uses "abilities" but database/API still uses "features"
  firstObserved?: string;

  // MidJourney parameters
  midjourneyPrompt?: string;
  midjourneySref?: string;
  midjourneyProfile?: string;
  midjourneyStylization?: number;
  midjourneyStyleWeight?: number;

  // Metaphysical properties
  metaphysical?: MetaphysicalProperties;

  // Relationships
  connections: string[];

  // Media (populated from denizen_media table)
  media?: DenizenMedia[];
}

export type MediaType = 'image' | 'video' | 'thumbnail';

export interface DenizenMedia {
  id: string;
  denizenId: string;
  mediaType: MediaType;
  storagePath: string;
  fileName: string;
  name?: string;  // Editable display name (defaults to fileName)
  fileSize?: number;
  mimeType?: string;
  displayOrder: number;
  isPrimary: boolean;
  caption?: string;
  altText?: string;
  createdAt: string;
  updatedAt: string;
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

// Archive Log Types
export interface ArchiveLog {
  id: string;
  entryType: ArchiveEntryType;
  entityId?: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  createdBy?: string;
  createdAt: string;
}

// Archivist Session Types
export interface ChatMessage {
  role: 'user' | 'archivist';
  content: string;
  timestamp: string;
}

export interface VideoFrame {
  timestamp: string;
  description: string;
  entities: string[];
}

export interface VideoAnalysis {
  frames: VideoFrame[];
  summary: string;
  entities?: string[];
  metadata?: Record<string, any>;
}

export interface ArchivistSession {
  id: string;
  denizenId?: string;
  userId?: string;
  messages: ChatMessage[];
  extractedFields: Partial<Denizen>;
  videoAnalysis?: VideoAnalysis;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Domain {
  id: string;
  name: string;
  srefCode: string | null;
  description: string | null;
  colorR: number;
  colorG: number;
  colorB: number;
  colorHex: string;
  createdAt: string;
  updatedAt: string;
}
