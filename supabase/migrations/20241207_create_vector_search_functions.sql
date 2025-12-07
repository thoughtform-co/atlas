-- Atlas Eidolon Vector Search Functions
-- RPC functions for semantic similarity search using pgvector

-- Ensure vector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to search denizens by embedding similarity
CREATE OR REPLACE FUNCTION search_denizens_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  subtitle TEXT,
  type TEXT,
  image TEXT,
  thumbnail TEXT,
  video_url TEXT,
  glyphs TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  coord_geometry NUMERIC,
  coord_alterity NUMERIC,
  coord_dynamics NUMERIC,
  allegiance TEXT,
  threat_level TEXT,
  domain TEXT,
  description TEXT,
  lore TEXT,
  features TEXT[],
  first_observed TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.subtitle,
    d.type,
    d.image,
    d.thumbnail,
    d.video_url,
    d.glyphs,
    d.position_x,
    d.position_y,
    d.coord_geometry,
    d.coord_alterity,
    d.coord_dynamics,
    d.allegiance,
    d.threat_level,
    d.domain,
    d.description,
    d.lore,
    d.features,
    d.first_observed,
    1 - (d.embedding_signature <=> query_embedding) AS similarity
  FROM denizens d
  WHERE d.embedding_signature IS NOT NULL
    AND 1 - (d.embedding_signature <=> query_embedding) > match_threshold
  ORDER BY d.embedding_signature <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search archive log by embedding similarity
CREATE OR REPLACE FUNCTION search_archive_log_by_embedding(
  query_embedding vector(1536),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  denizen_id TEXT,
  timestamp TIMESTAMPTZ,
  entry TEXT,
  archivist_name TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.entity_id AS denizen_id,
    a.created_at AS timestamp,
    a.content AS entry,
    COALESCE(a.created_by::text, 'AI Archivist') AS archivist_name,
    ARRAY(SELECT jsonb_array_elements_text(a.metadata->'tags')) AS tags,
    a.metadata,
    1 - (a.embedding <=> query_embedding) AS similarity
  FROM archive_log a
  WHERE a.embedding IS NOT NULL
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_denizens_by_embedding TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_archive_log_by_embedding TO anon, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION search_denizens_by_embedding IS
  'Search denizens by semantic similarity using pgvector cosine distance';

COMMENT ON FUNCTION search_archive_log_by_embedding IS
  'Search archive log entries by semantic similarity using pgvector cosine distance';

