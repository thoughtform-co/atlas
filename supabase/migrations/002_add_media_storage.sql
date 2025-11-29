-- Atlas Eidolon Media Storage Schema
-- This migration adds support for uploading pictures and videos for denizens

-- Create media table to track uploaded files
CREATE TABLE denizen_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  denizen_id TEXT NOT NULL REFERENCES denizens(id) ON DELETE CASCADE,
  
  -- Media type classification
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'thumbnail')),
  
  -- Storage details
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Display order (for multiple images)
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Is this the primary/featured media?
  is_primary BOOLEAN NOT NULL DEFAULT false,
  
  -- Optional caption or alt text
  caption TEXT,
  alt_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_denizen_media_denizen_id ON denizen_media(denizen_id);
CREATE INDEX idx_denizen_media_type ON denizen_media(media_type);
CREATE INDEX idx_denizen_media_primary ON denizen_media(denizen_id, is_primary) WHERE is_primary = true;

-- Apply updated_at trigger
CREATE TRIGGER update_denizen_media_updated_at
  BEFORE UPDATE ON denizen_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE denizen_media ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to denizen_media"
  ON denizen_media FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for authenticated write access
CREATE POLICY "Allow authenticated insert to denizen_media"
  ON denizen_media FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to denizen_media"
  ON denizen_media FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to denizen_media"
  ON denizen_media FOR DELETE
  TO authenticated
  USING (true);

-- Add video_url field to denizens table for direct video embeds
ALTER TABLE denizens ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Note: You also need to create a storage bucket in Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Create a new bucket called 'denizen-media'
-- 3. Set the bucket to public (or private with signed URLs)
-- 4. Configure allowed MIME types: image/*, video/*

