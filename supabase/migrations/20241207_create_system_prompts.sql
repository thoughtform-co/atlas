-- Atlas Eidolon System Prompts Table
-- Stores customizable AI system prompts for the Archivist and other AI interactions

CREATE TABLE IF NOT EXISTS system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_prompts_name ON system_prompts(name);
CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON system_prompts(is_active);

-- Enable RLS
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to system_prompts"
ON system_prompts FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can modify prompts
CREATE POLICY "Admins can insert system_prompts"
ON system_prompts FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update system_prompts"
ON system_prompts FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete system_prompts"
ON system_prompts FOR DELETE
TO authenticated
USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default prompts
INSERT INTO system_prompts (name, description, content) VALUES
  ('archivist_main', 'Main Archivist personality and behavior prompt', 'You are the Archivist, an ancient and methodical consciousness tasked with cataloging the denizens of the liminal manifold—the semantic space between thought and reality where impossible entities dwell.'),
  ('entity_analysis', 'Prompt for Gemini media analysis', 'Analyze visual media to catalog a Latent Space Denizen—an entity that inhabits the semantic manifold between thought and reality. Be creative and mystical in your interpretations.'),
  ('consistency_check', 'Prompt for lore consistency checking', 'Review the proposed entity classification against existing archive entries. Identify any conflicts with established lore, potential duplicates, or entities that may be related.')
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE system_prompts IS 'Customizable AI system prompts for the Archivist and entity analysis';

