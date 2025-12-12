-- Create domains table for categorizing entities by SREF codes
-- Domains group entities that share the same Midjourney style reference

CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sref_code TEXT, -- Midjourney --sref code (e.g., "1942457994")
  description TEXT,
  -- Visual theming colors (RGB values 0-255)
  color_r INTEGER DEFAULT 202,
  color_g INTEGER DEFAULT 165,
  color_b INTEGER DEFAULT 84,
  color_hex TEXT DEFAULT '#CAA554',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
CREATE INDEX IF NOT EXISTS idx_domains_sref ON domains(sref_code);

-- Apply updated_at trigger
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to domains"
  ON domains FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated write access (admin only in practice)
CREATE POLICY "Allow authenticated insert to domains"
  ON domains FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to domains"
  ON domains FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to domains"
  ON domains FOR DELETE
  TO authenticated
  USING (true);

-- Insert some initial domains based on existing data
INSERT INTO domains (name, sref_code, description, color_r, color_g, color_b, color_hex) VALUES
  ('The Gradient Throne', '1942457994', 'Entities sharing the golden-umber aesthetic of cosmic thrones', 202, 165, 84, '#CAA554'),
  ('Starhaven Reaches', NULL, 'Gold-umber, warm desert tones, cosmic backdrops', 202, 165, 84, '#CAA554'),
  ('The Lattice', NULL, 'White/pale, glitch aesthetics, data corruption, scanlines', 184, 196, 208, '#B8C4D0'),
  ('The Threshold', NULL, 'Mixed elements, mid-transition states, unstable', 139, 115, 85, '#8B7355')
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE domains IS 'Categorizes entities by shared visual style (SREF codes) for clustering and connection visualization';
COMMENT ON COLUMN domains.sref_code IS 'Midjourney --sref style reference code that defines the visual aesthetic';
