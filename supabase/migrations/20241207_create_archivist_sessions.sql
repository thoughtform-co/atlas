-- Atlas Eidolon Archivist Sessions Table
-- Tracks interactive cataloguing sessions between users and the AI archivist

-- Create archivist_sessions table for managing cataloguing workflows
CREATE TABLE archivist_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the denizen being catalogued (nullable - entity might not exist yet)
  denizen_id TEXT REFERENCES denizens(id) ON DELETE CASCADE,

  -- User conducting the cataloguing session
  user_id UUID,

  -- Conversation history
  -- Array of {role: 'user' | 'archivist', content: string, timestamp: string}
  messages JSONB NOT NULL DEFAULT '[]',

  -- Fields extracted so far during the session
  -- Mirrors the denizen schema structure
  extracted_fields JSONB NOT NULL DEFAULT '{}',

  -- Results from Claude vision analysis of uploaded media
  -- {frames: [{timestamp: string, description: string, entities: string[]}], summary: string}
  video_analysis JSONB,

  -- Session status
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_archivist_sessions_denizen_id ON archivist_sessions(denizen_id);
CREATE INDEX idx_archivist_sessions_user_id ON archivist_sessions(user_id);
CREATE INDEX idx_archivist_sessions_status ON archivist_sessions(status);
CREATE INDEX idx_archivist_sessions_created_at ON archivist_sessions(created_at DESC);

-- Apply updated_at trigger
CREATE TRIGGER update_archivist_sessions_updated_at
  BEFORE UPDATE ON archivist_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE archivist_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions"
  ON archivist_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create sessions
CREATE POLICY "Users can create sessions"
  ON archivist_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON archivist_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON archivist_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON COLUMN archivist_sessions.messages IS
  'Conversation history: [{role: "user" | "archivist", content: string, timestamp: string}]';

COMMENT ON COLUMN archivist_sessions.extracted_fields IS
  'Partially filled denizen fields collected during the session';

COMMENT ON COLUMN archivist_sessions.video_analysis IS
  'Claude vision API analysis results: {frames: [], summary: string, entities: []}';
