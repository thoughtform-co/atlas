-- Atlas Eidolon Archive Log Table
-- Natural language log of all archive activities by the AI archivist

-- Ensure vector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- Create archive_log table for tracking all archival events
CREATE TABLE archive_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type of archive entry
  entry_type TEXT NOT NULL CHECK (
    entry_type IN (
      'entity_created',
      'entity_updated',
      'relationship_formed',
      'lore_added',
      'consistency_check',
      'anomaly_detected',
      'metadata_enriched'
    )
  ),

  -- Reference to the entity (nullable as some logs might be system-wide)
  entity_id TEXT REFERENCES denizens(id) ON DELETE SET NULL,

  -- Natural language description of the event
  content TEXT NOT NULL,

  -- Semantic embedding for similarity search (Voyage AI embeddings)
  embedding VECTOR(1536),

  -- Additional structured metadata
  metadata JSONB DEFAULT '{}',

  -- Who created this log entry (null for AI archivist)
  created_by UUID,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_archive_log_entry_type ON archive_log(entry_type);
CREATE INDEX idx_archive_log_entity_id ON archive_log(entity_id);
CREATE INDEX idx_archive_log_created_at ON archive_log(created_at DESC);

-- Create vector index for semantic search
CREATE INDEX idx_archive_log_embedding
  ON archive_log USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE archive_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access to archive logs
CREATE POLICY "Allow public read access to archive_log"
  ON archive_log FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated write access
CREATE POLICY "Allow authenticated insert to archive_log"
  ON archive_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to archive_log"
  ON archive_log FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete to archive_log"
  ON archive_log FOR DELETE
  TO authenticated
  USING (true);

-- Add comment to document the metadata structure
COMMENT ON COLUMN archive_log.metadata IS
  'Flexible JSONB field for additional context: changes made, fields updated, relationships involved, etc.';
