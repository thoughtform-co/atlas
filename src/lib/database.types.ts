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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      denizen_type: DenizenTypeEnum
      allegiance: AllegianceEnum
      threat_level: ThreatLevelEnum
      connection_type: ConnectionTypeEnum
    }
  }
}
