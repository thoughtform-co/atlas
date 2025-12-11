# Implementation Documentation

This document maps the Atlas Archivist Skill concepts to the actual codebase implementation.

## Architecture Overview

The Archivist is implemented as a TypeScript class that orchestrates Claude API calls, tool execution, field extraction, and session management.

```
┌─────────────────────────────────────────────────────────┐
│                    Archivist Class                       │
│  (src/lib/archivist/archivist.ts)                       │
├─────────────────────────────────────────────────────────┤
│  • Session Management (Supabase)                        │
│  • Tool Calling Loop                                    │
│  • Field Extraction Orchestration                       │
│  • World Context Building                               │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ System Prompt│    │    Tools     │    │   Utils      │
│ system-      │    │   tools.ts   │    │  utils.ts    │
│ prompt.ts    │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Field        │    │   Vector     │    │   Gemini     │
│ Extraction   │    │   Search     │    │   Analysis   │
│ field-       │    │   (Voyage)   │    │   (Gemini)   │
│ extraction.ts│    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Core Files

### src/lib/archivist/archivist.ts

**Main Archivist class** that orchestrates the cataloguing workflow.

**Key Methods**:
- `startSession(userId, initialMedia?)`: Creates new cataloguing session
- `chat(sessionId, userMessage, imageUrl?)`: Processes user message and returns Archivist response
- `getSession(sessionId)`: Retrieves session from database
- `getExtractedFields(sessionId)`: Gets current extracted fields
- `commitToArchive(sessionId)`: Creates denizen from session

**Tool Calling Loop** (lines 279-323):
```typescript
// Initial Claude call with tools
let response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  tools: ARCHIVIST_TOOLS,
  messages: conversationHistory,
});

// Process tool calls until final response
while (response.stop_reason === 'tool_use' && toolCallCount < maxToolCalls) {
  // Execute all tool_use blocks
  const toolResults = await Promise.all(
    toolUseBlocks.map(toolUse => executeToolCall(...))
  );
  
  // Add tool results to conversation
  conversationHistory.push({ role: 'assistant', content: response.content });
  conversationHistory.push({ role: 'user', content: toolResults });
  
  // Continue conversation
  response = await anthropic.messages.create({...});
}
```

**Session Management**:
- Sessions stored in Supabase `archivist_sessions` table
- JSONB fields for `messages`, `extracted_fields`, `video_analysis`
- Status tracking: `in_progress`, `completed`, `abandoned`

### src/lib/archivist/system-prompt.ts

**System prompts and prompt building functions**.

**Key Exports**:
- `ARCHIVIST_BASE_PROMPT`: Core Archivist persona and instructions
- `buildArchivistSystemPrompt(worldContext?)`: Builds prompt with optional world context
- `ARCHIVIST_OPENING_WITH_MEDIA`: Opening message when media is provided
- `ARCHIVIST_OPENING_WITHOUT_MEDIA`: Opening message without media
- `FIELD_EXTRACTION_PROMPT`: Prompt for field extraction

**World Context Injection**:
```typescript
prompt = prompt.replace('{{DYNAMIC_WORLD_CONTEXT}}', worldContext || '');
```

### src/lib/archivist/tools.ts

**Tool definitions, handlers, and execution logic**.

**Tool Schemas** (lines 21-94):
- `find_similar`: Semantic search via embeddings
- `analyze_image`: Visual analysis via Gemini
- `generate_description`: Mythopoetic description generation
- `find_by_sref`: Midjourney sref lookup (stub)

**Tool Handlers**:
- `handleFindSimilar`: Calls `searchByText` from vector-search
- `handleAnalyzeImage`: Calls `analyzeMediaUrl` from Gemini
- `handleGenerateDescription`: Uses Claude chat to generate descriptions
- `handleFindBySref`: Stub implementation

**Tool Execution** (lines 323-393):
- `executeToolCall(toolUseId, toolName, toolInput)`: Executes single tool
- Timeout handling (30 seconds)
- Error handling with user-friendly messages
- Logging of tool invocations

### src/lib/archivist/field-extraction.ts

**Field extraction, validation, and confidence scoring**.

**Key Functions**:
- `extractFieldsFromResponse(userMessage, archivistResponse, conversationHistory)`: Extracts fields using Claude
- `cleanExtractedFields(raw)`: Validates and cleans extracted fields
- `mergeFields(existing, newFields)`: Merges new fields with existing
- `validateFields(fields)`: Validates completeness and calculates confidence
- `generateSuggestedQuestions(fields)`: Generates follow-up questions

**Extraction Process**:
1. Build prompt with conversation history
2. Call Claude with low temperature (0.3) for consistency
3. Parse JSON from response (handles markdown code blocks)
4. Clean and validate fields
5. Return partial ExtractedFields

**Confidence Calculation**:
```typescript
confidence = (filledRequired / requiredFields) * 0.7 + 
            (filledOptional / optionalFields) * 0.3
```

### src/lib/archivist/utils.ts

**Utility functions for database integration and world context**.

**Key Functions**:
- `buildArchivistWorldContext(denizens)`: Builds world context markdown
- `extractedFieldsToDatabaseRow(fields, position)`: Converts to database format
- `generatePositionFromCoordinates(fields)`: Calculates 2D position from 3D coords
- `generateGlyphs(fields)`: Generates symbolic glyphs
- `validateDenizenCreation(fields)`: Validates before database insert

**World Context Building** (lines 330-404):
- Counts entities by type and allegiance
- Lists discovered domains (up to 15)
- Shows recent additions (top 5)
- Lists all entity names for connection suggestions

### src/lib/archivist/types.ts

**TypeScript type definitions**.

**Key Types**:
- `ExtractedFields`: Fields extracted during conversation
- `ArchivistSession`: Session state and history
- `ArchivistMessage`: Individual message in conversation
- `ArchivistResponse`: Response from chat method
- `ValidationResult`: Field validation result
- `MediaAnalysis`: Initial media analysis
- `ExtendedClassification`: Advanced classification parameters

## Data Flow

### Starting a Session

```
User uploads media
    ↓
Media analyzed (Gemini)
    ↓
Archivist.startSession(userId, mediaAnalysis)
    ↓
Generate opening message
    ↓
Create session in Supabase
    ↓
Return session with opening message
```

### Processing a Message

```
User sends message
    ↓
Archivist.chat(sessionId, message)
    ↓
Load session from Supabase
    ↓
Fetch world context (all denizens)
    ↓
Build system prompt with world context
    ↓
Add user message to conversation history
    ↓
Call Claude with tools
    ↓
[Tool Calling Loop]
    ├─→ Execute tools (find_similar, analyze_image, etc.)
    ├─→ Add tool results to conversation
    └─→ Continue until final response
    ↓
Extract fields from conversation
    ↓
Merge with existing fields
    ↓
Validate and calculate confidence
    ↓
Generate suggested questions
    ↓
Update session in Supabase
    ↓
Return ArchivistResponse
```

### Committing to Archive

```
User confirms cataloguing complete
    ↓
Archivist.commitToArchive(sessionId)
    ↓
Load session and extracted fields
    ↓
Validate fields are complete
    ↓
Generate position from coordinates
    ↓
Convert to database row format
    ↓
Create denizen in Supabase
    ↓
Update session status to 'completed'
    ↓
Return created denizen
```

## Database Schema

### archivist_sessions Table

```sql
CREATE TABLE archivist_sessions (
  id UUID PRIMARY KEY,
  denizen_id TEXT REFERENCES denizens(id),
  user_id UUID,
  messages JSONB NOT NULL DEFAULT '[]',
  extracted_fields JSONB NOT NULL DEFAULT '{}',
  video_analysis JSONB,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

**JSONB Fields**:
- `messages`: Array of `{role, content, timestamp, extractedFields?}`
- `extracted_fields`: Object matching `ExtractedFields` type
- `video_analysis`: Media analysis results

## API Integration

### Anthropic Claude API

**Model**: `claude-sonnet-4-5-20250929`
**Usage**:
- Main conversation with tools
- Field extraction (low temperature: 0.3)
- Description generation

**Configuration**:
- Max tokens: 4000 (conversation), 2000 (extraction)
- Temperature: 0.7 (conversation), 0.3 (extraction)

### Gemini API

**Usage**: Visual analysis of uploaded images/videos
**Integration**: Via `src/lib/ai/gemini.ts`
**Called by**: `analyze_image` tool

### Voyage AI Embeddings

**Usage**: Semantic search for similar entities
**Integration**: Via `src/lib/ai/vector-search.ts`
**Called by**: `find_similar` tool

## Session Persistence

Sessions are persisted in Supabase using service role key (bypasses RLS):

```typescript
const supabase = createClient(url, serviceRoleKey);
```

**Session Lifecycle**:
1. Created: `status = 'in_progress'`
2. Updated: On each chat message
3. Completed: `status = 'completed'` when committed
4. Abandoned: `status = 'abandoned'` if inactive

## Error Handling

### Tool Execution Errors
- Timeout: 30-second timeout per tool
- API failures: Graceful degradation with user-friendly messages
- Invalid responses: Filter and continue

### Field Extraction Errors
- JSON parsing failures: Return empty object, log error
- Invalid enum values: Filter out invalid, keep valid
- Missing fields: Generate suggested questions

### Session Errors
- Session not found: Throw error
- Invalid session status: Throw error
- Database errors: Log and throw user-friendly error

## Configuration

### Tool Configuration
```typescript
{
  maxToolCalls: 3,        // Prevent infinite loops
  timeoutMs: 30000,       // 30 second timeout
  maxSimilarResults: 10,  // Max results from find_similar
  defaultSimilarResults: 5 // Default limit
}
```

### Model Configuration
```typescript
{
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4000,         // Conversation
  temperature: 0.7,        // Conversation
  extractionTemperature: 0.3 // Field extraction
}
```

## Testing Considerations

### Unit Tests
- Field extraction logic
- Field validation
- Field merging
- World context building

### Integration Tests
- Tool execution
- Session management
- Database operations
- API calls (mock)

### E2E Tests
- Full cataloguing workflow
- Multi-turn conversations
- Tool calling sequences
- Session persistence

## Future Enhancements

1. **Streaming Responses**: Support streaming for real-time updates
2. **Skill Integration**: Use this Skill in other projects
3. **Advanced Tools**: Implement `find_by_sref` fully
4. **Context Optimization**: Cache world context for performance
5. **Multi-language**: Support non-English entity descriptions

