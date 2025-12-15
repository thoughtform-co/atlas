-- Forge Tables Migration
-- Creates tables for video generation sessions, generations, and cost tracking

-- ═══════════════════════════════════════════════════════════════
-- FORGE SESSIONS
-- Stores generation sessions (workspaces for organizing generations)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE forge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX idx_forge_sessions_user_id ON forge_sessions(user_id);
CREATE INDEX idx_forge_sessions_created_at ON forge_sessions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- FORGE GENERATIONS
-- Stores individual video generations with all parameters
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE forge_generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE forge_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES forge_sessions(id) ON DELETE CASCADE,
  denizen_id TEXT REFERENCES denizens(id) ON DELETE SET NULL,
  
  -- Source and output
  source_image_url TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  
  -- Generation parameters
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  resolution TEXT NOT NULL DEFAULT '720p',
  duration INTEGER NOT NULL DEFAULT 5 CHECK (duration IN (5, 10)),
  seed INTEGER,
  
  -- Status tracking
  status forge_generation_status NOT NULL DEFAULT 'pending',
  replicate_prediction_id TEXT,
  error_message TEXT,
  
  -- Cost tracking (in cents for precision)
  cost_cents INTEGER,
  
  -- Approval for showcase
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_forge_generations_session_id ON forge_generations(session_id);
CREATE INDEX idx_forge_generations_denizen_id ON forge_generations(denizen_id);
CREATE INDEX idx_forge_generations_status ON forge_generations(status);
CREATE INDEX idx_forge_generations_approved ON forge_generations(approved);
CREATE INDEX idx_forge_generations_created_at ON forge_generations(created_at DESC);
CREATE INDEX idx_forge_generations_replicate_id ON forge_generations(replicate_prediction_id);

-- ═══════════════════════════════════════════════════════════════
-- FORGE COSTS
-- Tracks cumulative spending per user for the cost ticker
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE forge_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES forge_generations(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_forge_costs_user_id ON forge_costs(user_id);
CREATE INDEX idx_forge_costs_created_at ON forge_costs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- Auto-update updated_at timestamps
-- ═══════════════════════════════════════════════════════════════

-- Trigger for forge_sessions updated_at
CREATE TRIGGER update_forge_sessions_updated_at
  BEFORE UPDATE ON forge_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE forge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_costs ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can only see/modify their own sessions
CREATE POLICY "Users can view own sessions"
  ON forge_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON forge_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON forge_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON forge_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Generations: Users can view/modify generations in their sessions
CREATE POLICY "Users can view generations in own sessions"
  ON forge_generations FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM forge_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert generations in own sessions"
  ON forge_generations FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM forge_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update generations in own sessions"
  ON forge_generations FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM forge_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete generations in own sessions"
  ON forge_generations FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM forge_sessions WHERE user_id = auth.uid()
    )
  );

-- Public can view approved generations (for showcase)
CREATE POLICY "Public can view approved generations"
  ON forge_generations FOR SELECT
  TO anon
  USING (approved = TRUE);

-- Costs: Users can only see their own costs
CREATE POLICY "Users can view own costs"
  ON forge_costs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own costs"
  ON forge_costs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role policy for webhook updates (via service_role key)
-- Note: Service role bypasses RLS by default
