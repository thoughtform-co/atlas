-- Atlas Eidolon Metaphysical Fields Migration
-- Adds advanced metaphysical properties and vector embeddings to denizens

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add metaphysical fields to denizens table
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS phase_state TEXT
    CHECK (phase_state IN ('Solid', 'Liminal', 'Spectral', 'Fluctuating', 'Crystallized'));

-- Superposition: array of quantum-like states with probabilities
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS superposition JSONB DEFAULT '[]';

-- Hallucination index: measures how "real" vs "imagined" the entity is
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS hallucination_index NUMERIC(3,2)
    CHECK (hallucination_index >= 0.00 AND hallucination_index <= 1.00);

-- Latent position: high-dimensional embedding in semantic space
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS latent_position VECTOR(1536);

-- Manifold curvature: geometric property of the entity's conceptual space
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS manifold_curvature NUMERIC(5,4);

-- Embedding signature: alternative embedding for multi-space positioning
ALTER TABLE denizens
  ADD COLUMN IF NOT EXISTS embedding_signature VECTOR(1536);

-- Create indexes for vector similarity search
-- Using cosine distance for similarity (1 - cosine similarity)
CREATE INDEX IF NOT EXISTS idx_denizens_latent_position
  ON denizens USING ivfflat (latent_position vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_denizens_embedding_signature
  ON denizens USING ivfflat (embedding_signature vector_cosine_ops)
  WITH (lists = 100);

-- Create index for phase_state queries
CREATE INDEX IF NOT EXISTS idx_denizens_phase_state ON denizens(phase_state);

-- Add comment to document the superposition structure
COMMENT ON COLUMN denizens.superposition IS
  'Array of quantum states: [{state: string, probability: number}]. Probabilities should sum to 1.0';
