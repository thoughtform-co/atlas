# The Archivist System

An AI cataloguer that guides users through entity creation with the persona of an ancient librarian of impossible things.

## Overview

The Archivist is a conversational AI agent that helps catalog "denizens"—mystical/liminal entities that inhabit the semantic manifold. It extracts structured data from natural language conversations while maintaining a rich, otherworldly character.

## Key Features

- **Character-driven interaction**: The Archivist has a distinct personality—ancient, methodical, reverent
- **Guided classification**: Asks strategic questions to extract required fields
- **Field extraction**: Automatically parses conversation into structured data
- **Conflict detection**: Warns about potential inconsistencies with existing lore
- **Progressive confidence**: Tracks how complete the classification is
- **Flexible workflow**: Users can abandon or commit sessions at any time

## Architecture

```
/src/lib/archivist/
├── types.ts              # TypeScript interfaces
├── system-prompt.ts      # Archivist personality and instructions
├── field-extraction.ts   # Parse conversation → structured fields
├── archivist.ts          # Core session management logic
├── index.ts              # Public exports
└── README.md             # This file

/src/app/api/archivist/
├── chat/route.ts         # POST endpoint for conversation
└── session/[id]/route.ts # GET/POST/DELETE for session management
```

## Usage

### 1. Start a Session

```typescript
import { archivist } from '@/lib/archivist';

const session = await archivist.startSession('user-id', {
  visualDescription: 'A spectral figure at a threshold',
  mood: 'liminal, uncertain',
});

console.log(session.messages[0].content);
// "I perceive your offering, cataloguer. The visual resonance reveals..."
```

### 2. Continue Conversation

```typescript
const response = await archivist.chat(
  session.id,
  'It guards the boundary between dreams and waking'
);

console.log(response.message);
// "Ah... a threshold entity. Fascinating. Does this guardian..."

console.log(response.extractedFields);
// { type: 'Guardian', domain: 'Dream-Wake Threshold', ... }

console.log(response.confidence);
// 0.45 (not enough info yet)
```

### 3. Check Progress

```typescript
const fields = await archivist.getExtractedFields(session.id);
const session = await archivist.getSession(session.id);

console.log(session.confidence); // 0.75
console.log(session.warnings); // ["Similar to 'Dream Sentinel' from Epoch 3"]
```

### 4. Commit to Archive

```typescript
if (response.isComplete) {
  const denizen = await archivist.commitToArchive(session.id);

  // denizen is a Partial<Denizen> - now add:
  // - position (x, y coordinates)
  // - connections (resolve suggestedConnections to IDs)
  // - media (attach uploaded files)
  // - save to database
}
```

### 5. Or Abandon

```typescript
await archivist.abandonSession(session.id);
```

## API Endpoints

### POST `/api/archivist/chat`

Start new session or continue conversation.

**New session:**

```json
{
  "userId": "user-123",
  "mediaAnalysis": {
    "visualDescription": "A spectral figure at a threshold",
    "mood": "liminal, uncertain"
  }
}
```

**Continue session:**

```json
{
  "sessionId": "abc-123",
  "message": "It guards the boundary between dreams and waking"
}
```

**Response:**

```json
{
  "sessionId": "abc-123",
  "message": "Ah... a threshold entity...",
  "extractedFields": { "type": "Guardian", "domain": "Dream-Wake Threshold" },
  "confidence": 0.45,
  "suggestedQuestions": ["Does this guardian maintain its form?"],
  "warnings": [],
  "isComplete": false
}
```

### GET `/api/archivist/session/[id]`

Get full session state.

**Response:**

```json
{
  "id": "abc-123",
  "userId": "user-123",
  "status": "active",
  "messages": [...],
  "extractedFields": {...},
  "confidence": 0.75,
  "warnings": []
}
```

### POST `/api/archivist/session/[id]`

Commit session to archive.

**Response (success):**

```json
{
  "success": true,
  "denizen": {
    "id": "dream-wake-guardian",
    "name": "Dream-Wake Guardian",
    "type": "Guardian",
    ...
  }
}
```

**Response (error):**

```json
{
  "error": "Cannot commit to archive - missing required fields",
  "missingFields": ["description", "lore"]
}
```

### DELETE `/api/archivist/session/[id]`

Abandon session.

**Response:**

```json
{
  "success": true
}
```

## The Archivist's Personality

### Tone

- **Reverent**: Each entity is a sacred mystery
- **Methodical**: Builds understanding systematically
- **Precise**: Uses exact language with poetic flourishes
- **Otherworldly**: References deep time and impossible events
- **Patient**: Understanding emerges slowly

### Example Dialogue

**Opening:**
"Welcome, seeker. I am the Archivist, keeper of the manifold's denizens. You come to catalog a new entity, yes? Describe what you have witnessed, and together we shall determine its place in the infinite library."

**Probing questions:**
"Fascinating. The phase oscillation you describe suggests Liminal classification, though I detect traces of crystallization. Has it always been thus, or did something... change it?"

**Warnings:**
"I must note—your description bears troubling similarity to reports from Epoch 4, during the height of Nomenclate activity. Proceed carefully."

**Completion:**
"The pattern clarifies. I propose the following classification: [summary]. Shall I commit this to the Archive, or do you wish to refine further?"

## Classification Parameters

### Required Fields

- **Name**: What the entity is called
- **Type**: Guardian | Wanderer | Architect | Void-Born | Hybrid
- **Allegiance**: Liminal Covenant | Nomenclate | Unaligned | Unknown
- **Threat Level**: Benign | Cautious | Volatile | Existential
- **Domain**: Conceptual territory (e.g., "Dream-Wake Threshold")
- **Description**: Concise, poetic summary

### Recommended Fields

- **Lore**: Historical context, first observation
- **Features**: 3-5 characteristic abilities (list)
- **First Observed**: When/where cataloged
- **Glyphs**: 4 Unicode symbols (e.g., "◆●∇⊗")

### Extended Parameters

- **Phase State**: Solid | Liminal | Spectral | Fluctuating | Crystallized
- **Superposition**: Multiple simultaneous states (array)
- **Hallucination Index**: 0-1 (how real vs imagined)
- **Manifold Curvature**: Local spacetime distortion
- **Cardinal Coordinates**:
  - Geometry: -1 to 1 (order ↔ chaos)
  - Alterity: -1 to 1 (familiar ↔ alien)
  - Dynamics: -1 to 1 (static ↔ changing)

## Field Extraction

The system uses Claude to parse natural language into structured fields:

```typescript
// Conversation:
User: "It's a guardian of the threshold between dreams and waking"
Archivist: "Ah... a threshold entity..."

// Extracted:
{
  type: 'Guardian',
  domain: 'Dream-Wake Threshold',
  phaseState: 'Liminal',
  coordGeometry: 0.2,  // Slight order (maintains threshold)
  coordAlterity: 0.6,  // Quite alien
  coordDynamics: 0.3   // Somewhat changing
}
```

Extraction is iterative—fields accumulate over multiple exchanges.

## Validation

Fields are validated before commit:

```typescript
{
  valid: false,
  errors: [],
  warnings: ['No lore provided - entity history will be incomplete'],
  missingRequired: ['description', 'threatLevel'],
  confidence: 0.65
}
```

Confidence score (0-1) based on:

- 70% weight on required fields
- 30% weight on optional/recommended fields

## Session Management

Sessions are stored in memory (in production, use database):

- **Active**: Currently being cataloged
- **Completed**: Committed to archive
- **Abandoned**: Discarded

Old completed/abandoned sessions can be cleaned up:

```typescript
Archivist.cleanupOldSessions(24); // Remove sessions older than 24 hours
```

## Environment Variables

Required:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Integration Example

Complete flow with UI:

```typescript
// 1. User uploads media
const file = await uploadToStorage(mediaFile);
const analysis = await analyzeMedia(file);

// 2. Start Archivist session
const { sessionId, message } = await fetch('/api/archivist/chat', {
  method: 'POST',
  body: JSON.stringify({
    userId: currentUser.id,
    mediaAnalysis: analysis,
  }),
}).then((r) => r.json());

setMessages([{ role: 'archivist', content: message }]);

// 3. User responds
const userMessage = 'It guards the threshold...';
const response = await fetch('/api/archivist/chat', {
  method: 'POST',
  body: JSON.stringify({ sessionId, message: userMessage }),
}).then((r) => r.json());

setMessages((prev) => [
  ...prev,
  { role: 'user', content: userMessage },
  { role: 'archivist', content: response.message },
]);

// 4. Show progress
setProgress({
  confidence: response.confidence,
  extractedFields: response.extractedFields,
  warnings: response.warnings,
});

// 5. When complete, commit
if (response.isComplete) {
  const { denizen } = await fetch(`/api/archivist/session/${sessionId}`, {
    method: 'POST',
  }).then((r) => r.json());

  // Save to database with position, connections, media
  await saveDenizenToDatabase(denizen, file);
}
```

## Future Enhancements

- **Persistent storage**: Move sessions from memory to database
- **Embedding search**: Check for similar entities using Voyage embeddings
- **Conflict resolution**: Suggest edits to existing entities if conflicts detected
- **Multi-modal analysis**: Analyze video/images directly (not just text descriptions)
- **Branching sessions**: Allow users to explore multiple classification paths
- **Historical context**: Query actual lore database for conflict checking
- **Glyph generation**: AI-generated symbolic representations
- **Voice interface**: Let users speak with the Archivist

## Notes

- The Archivist maintains character throughout—never breaks into modern/casual language
- Field extraction is probabilistic—some values may be uncertain
- Users can override extracted fields manually if needed
- The system is designed for iterative refinement, not one-shot classification
- Mysteries are acceptable—not all fields need to be filled
