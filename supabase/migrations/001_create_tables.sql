-- Atlas Eidolon Database Schema
-- Run this in your Supabase SQL Editor to set up the tables

-- Create custom enum types
CREATE TYPE denizen_type AS ENUM ('Guardian', 'Wanderer', 'Architect', 'Void-Born', 'Hybrid');
CREATE TYPE allegiance AS ENUM ('Liminal Covenant', 'Nomenclate', 'Unaligned', 'Unknown');
CREATE TYPE threat_level AS ENUM ('Benign', 'Cautious', 'Volatile', 'Existential');
CREATE TYPE connection_type AS ENUM ('semantic', 'historical', 'adversarial');

-- Create denizens table
CREATE TABLE denizens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  type denizen_type NOT NULL,
  image TEXT,
  thumbnail TEXT,
  glyphs TEXT NOT NULL,
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  coord_geometry REAL NOT NULL DEFAULT 0,
  coord_alterity REAL NOT NULL DEFAULT 0,
  coord_dynamics REAL NOT NULL DEFAULT 0,
  allegiance allegiance NOT NULL DEFAULT 'Unknown',
  threat_level threat_level NOT NULL DEFAULT 'Cautious',
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  features TEXT[],
  first_observed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_denizen_id TEXT NOT NULL REFERENCES denizens(id) ON DELETE CASCADE,
  to_denizen_id TEXT NOT NULL REFERENCES denizens(id) ON DELETE CASCADE,
  strength REAL NOT NULL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  type connection_type NOT NULL DEFAULT 'semantic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_denizen_id, to_denizen_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_denizens_type ON denizens(type);
CREATE INDEX idx_denizens_allegiance ON denizens(allegiance);
CREATE INDEX idx_connections_from ON connections(from_denizen_id);
CREATE INDEX idx_connections_to ON connections(to_denizen_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to denizens table
CREATE TRIGGER update_denizens_updated_at
  BEFORE UPDATE ON denizens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE denizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to denizens"
  ON denizens FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to connections"
  ON connections FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for authenticated write access (for admin)
CREATE POLICY "Allow authenticated insert to denizens"
  ON denizens FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to denizens"
  ON denizens FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to denizens"
  ON denizens FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to connections"
  ON connections FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to connections"
  ON connections FOR DELETE
  TO authenticated
  USING (true);
