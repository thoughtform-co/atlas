-- Add Gemini analysis storage to denizens table
-- Caches the AI vision analysis so it doesn't need to be re-run each time

ALTER TABLE denizens 
  ADD COLUMN IF NOT EXISTS gemini_analysis JSONB;

-- Add index for queries that filter by analysis existence
CREATE INDEX IF NOT EXISTS idx_denizens_gemini_analysis 
  ON denizens USING GIN (gemini_analysis) 
  WHERE gemini_analysis IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN denizens.gemini_analysis IS 
  'Cached Gemini vision analysis of entity media (image/video). Contains: name, type, domain, description, visualNotes, suggestions, etc.';
