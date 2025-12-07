export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DenizenTypeEnum = 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';
export type AllegianceEnum = 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';
export type ThreatLevelEnum = 'Benign' | 'Cautious' | 'Volatile' | 'Existential';
export type ConnectionTypeEnum = 'semantic' | 'historical' | 'adversarial';

export type MediaType = 'image' | 'video' | 'thumbnail';
export type PhaseState = 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized';
export type ArchiveEntryType = 'entity_created' | 'entity_updated' | 'relationship_formed' | 'lore_added' | 'consistency_check' | 'anomaly_detected' | 'metadata_enriched';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface SuperpositionState {
  state: string;
  probability: number;
}

export interface Database {
  public: {
    Tables: {
      denizens: {
        Row: {
          id: string
          name: string
          subtitle: string | null
          type: DenizenTypeEnum
          image: string | null
          thumbnail: string | null
          video_url: string | null
          glyphs: string
          position_x: number
          position_y: number
          coord_geometry: number
          coord_alterity: number
          coord_dynamics: number
          allegiance: AllegianceEnum
          threat_level: ThreatLevelEnum
          domain: string
          description: string
          lore: string | null
          features: string[] | null
          first_observed: string | null
          phase_state: PhaseState | null
          superposition: SuperpositionState[] | null
          hallucination_index: number | null
          latent_position: string | null
          manifold_curvature: number | null
          embedding_signature: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          subtitle?: string | null
          type: DenizenTypeEnum
          image?: string | null
          thumbnail?: string | null
          video_url?: string | null
          glyphs: string
          position_x: number
          position_y: number
          coord_geometry: number
          coord_alterity: number
          coord_dynamics: number
          allegiance: AllegianceEnum
          threat_level: ThreatLevelEnum
          domain: string
          description: string
          lore?: string | null
          features?: string[] | null
          first_observed?: string | null
          phase_state?: PhaseState | null
          superposition?: SuperpositionState[] | null
          hallucination_index?: number | null
          latent_position?: string | null
          manifold_curvature?: number | null
          embedding_signature?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subtitle?: string | null
          type?: DenizenTypeEnum
          image?: string | null
          thumbnail?: string | null
          video_url?: string | null
          glyphs?: string
          position_x?: number
          position_y?: number
          coord_geometry?: number
          coord_alterity?: number
          coord_dynamics?: number
          allegiance?: AllegianceEnum
          threat_level?: ThreatLevelEnum
          domain?: string
          description?: string
          lore?: string | null
          features?: string[] | null
          first_observed?: string | null
          phase_state?: PhaseState | null
          superposition?: SuperpositionState[] | null
          hallucination_index?: number | null
          latent_position?: string | null
          manifold_curvature?: number | null
          embedding_signature?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      denizen_media: {
        Row: {
          id: string
          denizen_id: string
          media_type: MediaType
          storage_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          display_order: number
          is_primary: boolean
          caption: string | null
          alt_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          denizen_id: string
          media_type: MediaType
          storage_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          display_order?: number
          is_primary?: boolean
          caption?: string | null
          alt_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          denizen_id?: string
          media_type?: MediaType
          storage_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          display_order?: number
          is_primary?: boolean
          caption?: string | null
          alt_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          from_denizen_id: string
          to_denizen_id: string
          strength: number
          type: ConnectionTypeEnum
          created_at: string
        }
        Insert: {
          id?: string
          from_denizen_id: string
          to_denizen_id: string
          strength: number
          type: ConnectionTypeEnum
          created_at?: string
        }
        Update: {
          id?: string
          from_denizen_id?: string
          to_denizen_id?: string
          strength?: number
          type?: ConnectionTypeEnum
          created_at?: string
        }
      }
      archive_log: {
        Row: {
          id: string
          entry_type: ArchiveEntryType
          entity_id: string | null
          content: string
          embedding: string | null
          metadata: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entry_type: ArchiveEntryType
          entity_id?: string | null
          content: string
          embedding?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entry_type?: ArchiveEntryType
          entity_id?: string | null
          content?: string
          embedding?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
      }
      archivist_sessions: {
        Row: {
          id: string
          denizen_id: string | null
          user_id: string | null
          messages: Json
          extracted_fields: Json
          video_analysis: Json | null
          status: SessionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          denizen_id?: string | null
          user_id?: string | null
          messages?: Json
          extracted_fields?: Json
          video_analysis?: Json | null
          status?: SessionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          denizen_id?: string | null
          user_id?: string | null
          messages?: Json
          extracted_fields?: Json
          video_analysis?: Json | null
          status?: SessionStatus
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'admin' | 'archivist'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'user' | 'admin' | 'archivist'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'admin' | 'archivist'
          created_at?: string
          updated_at?: string
        }
      }
      system_prompts: {
        Row: {
          id: string
          name: string
          description: string | null
          content: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          content: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          content?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_denizens_by_embedding: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: Array<{
          id: string
          name: string
          subtitle: string | null
          type: DenizenTypeEnum
          image: string | null
          thumbnail: string | null
          video_url: string | null
          glyphs: string
          position_x: number
          position_y: number
          coord_geometry: number
          coord_alterity: number
          coord_dynamics: number
          allegiance: AllegianceEnum
          threat_level: ThreatLevelEnum
          domain: string
          description: string
          lore: string | null
          features: string[] | null
          first_observed: string | null
          similarity: number
        }>
      }
      search_archive_log_by_embedding: {
        Args: {
          query_embedding: number[]
          match_count: number
        }
        Returns: Array<{
          id: string
          denizen_id: string | null
          created_timestamp: string
          entry: string
          archivist_name: string
          tags: string[] | null
          metadata: Json
          similarity: number
        }>
      }
    }
    Enums: {
      denizen_type: DenizenTypeEnum
      allegiance: AllegianceEnum
      threat_level: ThreatLevelEnum
      connection_type: ConnectionTypeEnum
    }
  }
}
