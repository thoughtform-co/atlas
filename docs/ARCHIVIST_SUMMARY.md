# Archivist System - Implementation Summary

## Overview

The Archivist System has been successfully created for the Atlas project. It provides an AI-powered cataloguing experience that guides users through entity creation with the persona of an ancient librarian of impossible things.

## Files Created

### Core Library Files (`/src/lib/archivist/`)

#### 1. `/src/lib/archivist/types.ts`
TypeScript type definitions for the Archivist system:
- `PhaseState` - Extended classification enum (Solid, Liminal, Spectral, etc.)
- `ExtendedClassification` - Advanced entity properties
- `MediaAnalysis` - Input from uploaded media
- `ExtractedFields` - Accumulated entity data during conversation
- `ArchivistSession` - Session state and history
- `ArchivistMessage` - Individual conversation message
- `ArchivistResponse` - Archivist's reply with metadata
- `ValidationResult` - Field validation results

#### 2. `/src/lib/archivist/system-prompt.ts`
The Archivist's personality and instructions:
- **Main system prompt** defining the Archivist's:
  - Nature (ancient, methodical consciousness)
  - Tone (reverent, precise, otherworldly)
  - Knowledge of classification parameters
  - Cataloging process and questioning flow
- **Opening messages** (with/without media)
- **Field extraction prompt** for structured data parsing
- **Example dialogue** demonstrating character

**Key Personality Traits:**
- Ancient and timeless, has witnessed countless epochs
- Methodical and systematic in gathering information
- Reverent toward entities, treats each as a sacred mystery
- Precise language with poetic flourishes
- Occasionally cryptic, references deep time and impossible events
- Patient, never rushes understanding

#### 3. `/src/lib/archivist/field-extraction.ts`
Utilities for parsing conversation into structured data:
- `extractFieldsFromResponse()` - Uses Claude to parse natural language
- `cleanExtractedFields()` - Validates and normalizes extracted values
- `mergeFields()` - Combines new fields with existing session data
- `validateFields()` - Checks completeness and returns validation result
- `calculateConfidence()` - Computes 0-1 confidence score
- `generateSuggestedQuestions()` - Creates follow-up questions for missing fields

#### 4. `/src/lib/archivist/archivist.ts`
Core Archivist class and session management:

**Main Class: `Archivist`**
- `startSession(userId, initialMedia?)` - Begin new cataloging session
- `chat(sessionId, userMessage)` - Continue conversation, extract fields
- `getExtractedFields(sessionId)` - Retrieve current field state
- `getSession(sessionId)` - Get full session data
- `commitToArchive(sessionId)` - Finalize and create denizen
- `abandonSession(sessionId)` - Discard session
- `cleanupOldSessions(maxAgeHours)` - Maintenance utility

**Features:**
- In-memory session storage (Map-based)
- Automatic field extraction via Claude
- Progressive confidence tracking
- Conflict detection with existing lore (placeholder)
- Conversation history management

#### 5. `/src/lib/archivist/utils.ts`
Integration utilities for database and media systems:
- `extractedFieldsToDatabaseRow()` - Convert to Supabase insert format
- `generatePositionFromCoordinates()` - Map 3D coords to 2D position
- `generateNonCollidingPosition()` - Avoid entity overlap in constellation
- `findDenizenIdsByNames()` - Resolve connection names to IDs
- `generateGlyphs()` - Create symbolic glyphs from entity properties
- `formatExtendedClassification()` - Format advanced parameters
- `enrichLoreWithExtendedClassification()` - Add extended data to lore
- `validateDenizenCreation()` - Human-readable validation
- `generateSubtitle()` - Auto-generate subtitle if missing
- `calculateSemanticSimilarity()` - Compare entities (placeholder)
- `formatConfidence()` - Pretty-print confidence with emoji

#### 6. `/src/lib/archivist/index.ts`
Public exports and usage examples in comments

#### 7. `/src/lib/archivist/examples.ts`
Comprehensive usage examples:
- Simple session with media analysis
- Text-only session
- Abandoned session
- Complete conversation flow
- Session state management
- Validation error handling
- Example dialogue snippets

#### 8. `/src/lib/archivist/README.md`
Complete documentation:
- Architecture overview
- Usage guide with code examples
- API endpoint documentation
- Classification parameters reference
- Personality description
- Integration examples

### API Endpoints (`/src/app/api/archivist/`)

#### 9. `/src/app/api/archivist/chat/route.ts`
POST endpoint for conversation:
- Start new session (with/without media)
- Continue existing session
- Returns Archivist response + extracted fields + metadata
- Error handling for missing sessions, invalid requests

**Request:**
```json
{
  "sessionId": "optional-for-new",
  "message": "optional-for-new",
  "userId": "required-for-new",
  "mediaAnalysis": { "visualDescription": "...", "mood": "..." }
}
```

**Response:**
```json
{
  "sessionId": "abc-123",
  "message": "Archivist's response",
  "extractedFields": { "type": "Guardian", ... },
  "confidence": 0.65,
  "suggestedQuestions": ["..."],
  "warnings": ["..."],
  "isComplete": false
}
```

#### 10. `/src/app/api/archivist/session/[id]/route.ts`
Session management endpoint:
- **GET** - Retrieve full session state
- **POST** - Commit session to archive (create denizen)
- **DELETE** - Abandon session
- Error handling with specific status codes

## Architecture

```
User uploads media
      ↓
Media analysis (external)
      ↓
POST /api/archivist/chat (start session)
      ↓
Archivist generates opening
      ↓
User responds → POST /api/archivist/chat
      ↓
Claude generates response (in Archivist persona)
      ↓
Fields extracted from conversation
      ↓
Fields merged with session state
      ↓
Confidence calculated
      ↓
Repeat conversation until complete
      ↓
POST /api/archivist/session/[id] (commit)
      ↓
Denizen created (caller adds media, position, connections)
      ↓
Save to Supabase database
```

## Classification Parameters

### Required Fields
- **Name** - Entity designation
- **Type** - Guardian | Wanderer | Architect | Void-Born | Hybrid
- **Allegiance** - Liminal Covenant | Nomenclate | Unaligned | Unknown
- **Threat Level** - Benign | Cautious | Volatile | Existential
- **Domain** - Conceptual territory
- **Description** - Poetic summary

### Recommended Fields
- **Lore** - Historical context
- **Features** - List of 3-5 abilities
- **First Observed** - When/where cataloged
- **Glyphs** - 4 Unicode symbols

### Extended Parameters
- **Phase State** - Solid | Liminal | Spectral | Fluctuating | Crystallized
- **Superposition** - Multiple simultaneous states
- **Hallucination Index** - 0-1 (real ↔ imagined)
- **Manifold Curvature** - Spacetime distortion value
- **Cardinal Coordinates** - Geometry, Alterity, Dynamics (-1 to 1)

## Key Features

### 1. Character-Driven Interaction
The Archivist maintains a consistent persona throughout:
- Never breaks character into modern/casual language
- References impossible events, deep time, and cosmic mysteries
- Treats each entity with reverence and gravity

**Example Opening:**
> "I perceive your offering, cataloguer. The visual resonance reveals something... liminal. The threshold between observation and understanding beckons. Tell me—what is the nature of this entity?"

### 2. Progressive Understanding
The Archivist builds knowledge systematically:
1. Acknowledges initial observations
2. Asks about fundamental nature
3. Probes deeper qualities
4. Assesses allegiance and threat
5. Gathers historical context
6. Checks for conflicts
7. Synthesizes and confirms

### 3. Automatic Field Extraction
Uses Claude to parse natural language:
```typescript
User: "It guards the threshold between dreams and waking"
↓
Extracted: {
  type: 'Guardian',
  domain: 'Dream-Wake Threshold',
  phaseState: 'Liminal'
}
```

### 4. Confidence Tracking
Confidence score (0-1) based on:
- 70% weight: Required fields (name, type, allegiance, etc.)
- 30% weight: Optional fields (lore, features, coordinates, etc.)

### 5. Conflict Detection
Placeholder for checking against existing lore:
- Similar names
- Overlapping domains
- Contradictory historical references
- Duplicate coordinates

### 6. Flexible Workflow
Users can:
- Start sessions with or without media
- Abandon sessions at any time
- Manually override extracted fields
- Commit when ready (or when isComplete = true)

## Integration Points

### With Media System
```typescript
const analysis = await analyzeMedia(uploadedFile);
const session = await archivist.startSession(userId, analysis);
```

### With Database
```typescript
const denizen = await archivist.commitToArchive(sessionId);
const dbRow = extractedFieldsToDatabaseRow(denizen, position);
await supabase.from('denizens').insert(dbRow);
```

### With Constellation View
```typescript
const position = generatePositionFromCoordinates(extractedFields);
// Or avoid collisions:
const position = generateNonCollidingPosition(existingPositions);
```

### With Connection System
```typescript
const connectionIds = findDenizenIdsByNames(
  extractedFields.suggestedConnections,
  existingDenizens
);
```

## Environment Requirements

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Uses Claude Sonnet 4.5 for both:
- Archivist conversation (temperature 0.7)
- Field extraction (temperature 0.3)

## Example Usage Flow

```typescript
import { archivist } from '@/lib/archivist';

// 1. Start session
const session = await archivist.startSession('user-123', {
  visualDescription: 'Spectral figure at threshold',
  mood: 'liminal, uncertain'
});

// 2. Chat
const r1 = await archivist.chat(session.id,
  'It guards the boundary between dreams and waking'
);
console.log(r1.message); // Archivist's poetic response
console.log(r1.confidence); // 0.45 (needs more info)

// 3. Continue
const r2 = await archivist.chat(session.id,
  'It shifts between realms, serving no faction'
);

// 4. Check progress
if (r2.isComplete) {
  // 5. Commit
  const denizen = await archivist.commitToArchive(session.id);

  // 6. Save to database with media, position, connections
  await saveDenizenToDatabase(denizen, uploadedFile);
}
```

## Next Steps

To fully integrate the Archivist:

1. **Connect to media upload system**
   - Generate `MediaAnalysis` from uploaded images/videos
   - Use vision models or metadata extraction

2. **Create UI components**
   - Chat interface for conversation
   - Progress indicator showing confidence
   - Field preview showing extracted data
   - Warning display for conflicts

3. **Persistent storage**
   - Move sessions from in-memory Map to database
   - Add `archivist_sessions` table to Supabase

4. **Conflict detection**
   - Implement actual lore checking against database
   - Use semantic similarity (embeddings) to find related entities

5. **Enhanced field extraction**
   - Fine-tune prompts based on actual usage
   - Add multi-turn extraction for complex fields

6. **Testing**
   - Unit tests for field extraction and validation
   - Integration tests for full cataloging flow
   - Character consistency tests

## Notes

- Session storage is currently in-memory - will reset on server restart
- In production, use database for session persistence
- Extended classification parameters (phase state, etc.) are stored in lore field
- Can be enhanced with Voyage embeddings for semantic search
- The Archivist maintains character throughout - no modern language

## Summary

The Archivist System provides a rich, character-driven interface for entity cataloging. It combines AI conversation, structured data extraction, and mystical storytelling to create an immersive experience that fits the liminal/otherworldly aesthetic of the Atlas project.

**Total Files Created: 10**
- 8 library files
- 2 API endpoint files

All TypeScript files compile without errors and are fully documented with examples.
