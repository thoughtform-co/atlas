-- Entity Class System and MidJourney Parameters Migration
-- Adds entity_class, entity_name, and MidJourney parameter fields to denizens table
-- Adds name field to denizen_media table for editable media card names

-- Add new fields to denizens table
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS entity_class TEXT,
  ADD COLUMN IF NOT EXISTS entity_name TEXT,
  ADD COLUMN IF NOT EXISTS midjourney_prompt TEXT,
  ADD COLUMN IF NOT EXISTS midjourney_sref TEXT,
  ADD COLUMN IF NOT EXISTS midjourney_profile TEXT,
  ADD COLUMN IF NOT EXISTS midjourney_stylization INTEGER,
  ADD COLUMN IF NOT EXISTS midjourney_style_weight INTEGER;

-- Migrate existing data: Set entity_class = name for existing entities
-- This is a temporary migration - users should update these manually
UPDATE denizens
SET entity_class = name
WHERE entity_class IS NULL;

-- Add name field to denizen_media table for editable media card names
ALTER TABLE denizen_media
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Set default name to file_name for existing media
UPDATE denizen_media
SET name = file_name
WHERE name IS NULL;

-- Create index for entity_class queries (for dropdown population)
CREATE INDEX IF NOT EXISTS idx_denizens_entity_class ON denizens(entity_class) WHERE entity_class IS NOT NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN denizens.entity_class IS 'Entity class name (e.g., "Eigensage", "Nullseer") - used for visual/style clustering';
COMMENT ON COLUMN denizens.entity_name IS 'Individual entity name (e.g., "Vince") - distinguishes specific instances within a class';
COMMENT ON COLUMN denizens.midjourney_prompt IS 'Full MidJourney prompt text';
COMMENT ON COLUMN denizens.midjourney_sref IS 'Extracted MidJourney --sref code for style clustering';
COMMENT ON COLUMN denizens.midjourney_profile IS 'Extracted MidJourney --profile code';
COMMENT ON COLUMN denizens.midjourney_stylization IS 'Extracted MidJourney --s (stylization) value';
COMMENT ON COLUMN denizens.midjourney_style_weight IS 'Extracted MidJourney --sw (style weight) value';
COMMENT ON COLUMN denizen_media.name IS 'Editable display name for media card (defaults to file_name)';
