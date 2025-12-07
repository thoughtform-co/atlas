# Atlas AI Service Layer

AI-powered services for the Atlas visual bestiary system, providing vision analysis, embeddings, and semantic search capabilities.

## Overview

This module integrates three AI services:

- **Claude AI** - Vision analysis of images/videos and conversational AI
- **Voyage AI** - High-quality text embeddings for semantic search
- **pgvector** - PostgreSQL extension for efficient vector similarity search

## Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Claude AI API Key (from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-...

# Voyage AI API Key (from https://www.voyageai.com/)
VOYAGE_API_KEY=pa-...

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

Voyage AI uses fetch API (built-in), no additional package needed.

### 3. Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to denizens table
ALTER TABLE denizens ADD COLUMN IF NOT EXISTS embedding_signature vector(1536);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS denizens_embedding_idx ON denizens
USING ivfflat (embedding_signature vector_cosine_ops)
WITH (lists = 100);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION search_denizens_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  subtitle text,
  type text,
  image text,
  thumbnail text,
  video_url text,
  glyphs text,
  position_x float,
  position_y float,
  coord_geometry float,
  coord_alterity float,
  coord_dynamics float,
  allegiance text,
  threat_level text,
  domain text,
  description text,
  lore text,
  features text[],
  first_observed text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.subtitle,
    d.type::text,
    d.image,
    d.thumbnail,
    d.video_url,
    d.glyphs,
    d.position_x,
    d.position_y,
    d.coord_geometry,
    d.coord_alterity,
    d.coord_dynamics,
    d.allegiance::text,
    d.threat_level::text,
    d.domain,
    d.description,
    d.lore,
    d.features,
    d.first_observed,
    1 - (d.embedding_signature <=> query_embedding) as similarity
  FROM denizens d
  WHERE d.embedding_signature IS NOT NULL
    AND 1 - (d.embedding_signature <=> query_embedding) >= match_threshold
  ORDER BY d.embedding_signature <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Optional: Create archive_log table for semantic log search
CREATE TABLE IF NOT EXISTS archive_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  denizen_id uuid REFERENCES denizens(id),
  timestamp timestamptz DEFAULT now(),
  entry text NOT NULL,
  archivist_name text NOT NULL,
  tags text[],
  embedding vector(1536),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS archive_log_embedding_idx ON archive_log
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for archive log search
CREATE OR REPLACE FUNCTION search_archive_log_by_embedding(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  denizen_id uuid,
  timestamp timestamptz,
  entry text,
  archivist_name text,
  tags text[],
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.denizen_id,
    a.timestamp,
    a.entry,
    a.archivist_name,
    a.tags,
    a.metadata,
    1 - (a.embedding <=> query_embedding) as similarity
  FROM archive_log a
  WHERE a.embedding IS NOT NULL
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Usage Examples

### Vision Analysis

```typescript
import { analyzeImage, analyzeVideo } from '@/lib/ai';

// Analyze an uploaded image
const imageAnalysis = await analyzeImage('https://..../denizen.jpg');
console.log(imageAnalysis.appearance.colors);
console.log(imageAnalysis.rawDescription);

// Analyze a video
const videoAnalysis = await analyzeVideo('https://..../denizen.mp4');
console.log(videoAnalysis.behavior.movement);
console.log(videoAnalysis.suggestedFields.threatLevel);
```

### Embeddings & Search

```typescript
import {
  generateDenizenEmbedding,
  updateDenizenEmbedding,
  searchByText,
  searchSimilarEntities,
} from '@/lib/ai';

// Generate and store embedding for a new denizen
const denizen = {
  name: 'The Liminal Walker',
  description: 'A being that exists between spaces...',
  domain: 'Threshold Realms',
};

const embedding = await generateDenizenEmbedding(denizen);
await updateDenizenEmbedding(denizenId, denizen);

// Search for similar denizens by text
const results = await searchByText('entities that walk between worlds', 5);
results.forEach((result) => {
  console.log(`${result.denizen.name} - ${result.similarity * 100}% match`);
});

// Search by embedding vector
const similar = await searchSimilarEntities(embedding, 5, 0.7);
```

### Consistency Checking

```typescript
import { checkConsistency } from '@/lib/ai';

// Check if a new entity might be a duplicate
const report = await checkConsistency(
  'A shadowy figure that haunts corridors',
  'The Corridor Wraith'
);

if (!report.isConsistent) {
  console.log('Potential conflicts:', report.potentialConflicts);
  console.log('Suggestions:', report.suggestions);
}

report.similarEntities.forEach((similar) => {
  console.log(`Similar to: ${similar.denizen.name} (${similar.similarity})`);
});
```

### Chat with the Archivist

```typescript
import { chat, extractEntityInfo } from '@/lib/ai';

// Have a conversation
const response = await chat([
  {
    role: 'user',
    content: 'What patterns have you observed in threshold entities?',
  },
]);

// Extract structured data from free-form text
const info = await extractEntityInfo(
  'I saw a glowing blue entity with spiral patterns moving through the walls'
);
console.log(info.features); // ["glowing", "blue", "spiral patterns", "wall-phasing"]
```

### Batch Operations

```typescript
import { batchUpdateAllEmbeddings } from '@/lib/ai';

// Generate embeddings for all existing denizens
// (Run this once during initial setup)
const count = await batchUpdateAllEmbeddings(10);
console.log(`Updated ${count} denizen embeddings`);
```

## Module Structure

```
/src/lib/ai/
├── index.ts          # Main exports
├── config.ts         # Configuration & env checks
├── types.ts          # TypeScript type definitions
├── claude.ts         # Claude AI vision & chat
├── voyage.ts         # Voyage embeddings
├── vector-search.ts  # pgvector similarity search
└── README.md         # This file
```

## API Reference

### Configuration

- `isClaudeConfigured()` - Check if Claude API key is set
- `isVoyageConfigured()` - Check if Voyage API key is set
- `getAIServiceStatus()` - Get overall configuration status
- `getConfigurationError()` - Get helpful error message if misconfigured

### Claude AI

- `analyzeVideo(url)` - Analyze video for entity characteristics
- `analyzeImage(url)` - Analyze image for entity traits
- `chat(messages, systemPrompt?)` - Chat completion
- `extractEntityInfo(text)` - Extract structured data from text

### Voyage AI

- `generateEmbedding(text, inputType?)` - Single embedding
- `generateEmbeddings(texts, inputType?)` - Batch embeddings
- `generateDenizenEmbedding(denizen)` - Embedding from denizen data
- `generateSearchEmbedding(query)` - Embedding for search queries
- `cosineSimilarity(a, b)` - Calculate vector similarity

### Vector Search

- `searchSimilarEntities(embedding, limit?, threshold?)` - Find similar denizens
- `searchArchiveLog(embedding, limit?)` - Search archive logs
- `searchByText(query, limit?)` - Text-based semantic search
- `checkConsistency(description, name?)` - Check for duplicates/conflicts
- `updateDenizenEmbedding(id, denizen)` - Update denizen embedding
- `batchUpdateAllEmbeddings(batchSize?)` - Bulk embedding generation

## Error Handling

All functions throw `AIServiceError` with:

```typescript
interface AIServiceError {
  name: 'AIServiceError';
  message: string;
  service: 'claude' | 'voyage' | 'vector-search';
  originalError?: unknown;
}
```

Example:

```typescript
try {
  const analysis = await analyzeImage(imageUrl);
} catch (error) {
  if (error.name === 'AIServiceError') {
    console.error(`${error.service} error: ${error.message}`);
  }
}
```

## Cost Optimization

### Claude API

- Sonnet 4.5: ~$3 per million input tokens, ~$15 per million output tokens
- Use for vision analysis (images/videos) and important decisions
- Cache system prompts when possible

### Voyage AI

- Voyage-3: ~$0.12 per million tokens
- Voyage-3-lite: ~$0.06 per million tokens (cheaper, slightly lower quality)
- To use lite model, update `VOYAGE_MODEL` in `config.ts`

### Best Practices

1. **Batch operations** - Use `generateEmbeddings()` for multiple texts
2. **Cache embeddings** - Store in database, don't regenerate
3. **Rate limiting** - Built-in delays in batch operations
4. **Threshold tuning** - Adjust similarity thresholds to reduce API calls
5. **Lazy loading** - Only generate embeddings when needed

## Development

### Type Safety

All functions are fully typed with TypeScript. Import types as needed:

```typescript
import type {
  VideoAnalysis,
  ImageAnalysis,
  ConsistencyReport,
  SimilarEntity,
} from '@/lib/ai';
```

### Testing Configuration

Check if services are configured before using:

```typescript
import { getAIServiceStatus, getConfigurationError } from '@/lib/ai';

const status = getAIServiceStatus();
if (!status.allConfigured) {
  console.error(getConfigurationError());
}
```

## Future Enhancements

- [ ] Streaming responses for chat
- [ ] Image generation with DALL-E or Stable Diffusion
- [ ] Multi-modal embedding (text + image)
- [ ] Automatic embedding updates on denizen changes
- [ ] Embedding versioning and migration
- [ ] RAG (Retrieval Augmented Generation) for lore queries

## Resources

- [Claude API Documentation](https://docs.anthropic.com/)
- [Voyage AI Documentation](https://docs.voyageai.com/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai)
