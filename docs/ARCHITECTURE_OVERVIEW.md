# Atlas: Architecture & Flow Overview

## What is Atlas?

Atlas is a **research interface into semantic space**—a tool for cataloguing, visualizing, and exploring "Latent Space Denizens" (entities that exist in the semantic manifold between thought and reality). It combines database storage, AI analysis, vector search, and an interactive visualization system.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Constellation│  │ Admin Panel  │  │ Archive View │     │
│  │    View      │  │ (3-column)   │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │            │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Next.js API    │
                    │     Routes      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   Supabase     │  │   AI Services   │  │  Supabase      │
│   (Database)   │  │                 │  │  Storage       │
│                │  │  • Claude       │  │                │
│  • Denizens    │  │  • Gemini       │  │  • Entity      │
│  • Sessions    │  │  • Voyage       │  │    Media       │
│  • Vectors     │  │                 │  │                │
└────────────────┘  └─────────────────┘  └────────────────┘
```

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with design tokens
- **Canvas API** - Particle animations and visualizations
- **React 19** - UI rendering

### Backend/Infrastructure
- **Next.js API Routes** - Server-side endpoints
- **Supabase (PostgreSQL)** - Database with:
  - Row Level Security (RLS) for access control
  - Real-time subscriptions
  - Vector search via `pgvector`
- **Supabase Storage** - File storage for entity media

### AI Services
- **Claude (Anthropic)** - Archivist AI personality and conversation
- **Gemini (Google)** - Image/video analysis for entity cataloguing
- **Voyage AI** - Text embeddings for semantic search (1536-dimensional vectors)

---

## User Flows

### Flow 1: Viewing the Constellation

**User's Journey:**
1. Opens Atlas homepage → sees canvas view
2. Canvas displays denizen cards positioned by their semantic coordinates
3. Can pan/zoom to explore different regions
4. Hover over cards → see details panel
5. Click card → open full detail modal

**Technical Flow:**
```
Browser
  ↓
GET /api/denizens (or static data)
  ↓
Supabase: SELECT * FROM denizens
  ↓
Return JSON array
  ↓
React: Render cards on canvas at (position_x, position_y)
  ↓
Canvas: Draw particle connections between related entities
```

**Key Components:**
- `ConstellationView.tsx` - Main canvas component
- `EntityCard.tsx` - Individual entity card
- `DenizenModal.tsx` - Detail view modal

---

### Flow 2: Cataloguing a New Entity (Admin)

**User's Journey:**
1. Admin logs in → sees "+ NEW ENTITY" button in nav
2. Clicks button → navigates to `/admin/new-entity`
3. **Three-column interface:**
   - **Left**: Live preview card showing entity data
   - **Middle**: Form to input entity properties
   - **Right**: Chat with the Archivist AI

4. **Option A: Upload Media First**
   - Drag/drop image or video → Gemini analyzes it
   - Gemini extracts entity properties (type, threat, description, etc.)
   - Form auto-populates with extracted data
   - Archivist greets with analysis summary

5. **Option B: Start with Text**
   - Begin typing entity details
   - Chat with Archivist to refine properties
   - Archivist suggests values, checks for conflicts

6. **Complete Cataloguing:**
   - Fill required fields (name, type, coordinates, etc.)
   - Preview updates in real-time
   - Click "SAVE TO ARCHIVE"
   - Entity saved to database → redirect to archive

**Technical Flow:**
```
Upload Media
  ↓
POST /api/admin/upload
  ↓
Supabase Storage: Store file
  ↓
POST /api/admin/analyze (with media URL)
  ↓
Gemini API: Analyze image/video
  ↓
Return structured entity data
  ↓
React: Auto-populate form
  ↓
Chat with Archivist
  ↓
POST /api/archivist/chat
  ↓
Claude API: Generate Archivist response
  ↓
Extract fields from conversation
  ↓
Save to Supabase: archivist_sessions table
  ↓
User clicks "SAVE TO ARCHIVE"
  ↓
POST /api/admin/denizens
  ↓
Supabase: INSERT INTO denizens
  ↓
Generate embedding: POST to Voyage AI
  ↓
Update denizens.embedding_signature
  ↓
Redirect to /archive
```

**Key Components:**
- `EntityCardPreview.tsx` - Live preview with canvas visualizations
- `ParameterForm.tsx` - Input form
- `MediaUploadZone.tsx` - Drag-and-drop upload
- `ArchivistChat.tsx` - AI conversation interface
- `/api/admin/*` - Admin API routes
- `/api/archivist/chat` - Archivist conversation endpoint

---

### Flow 3: Semantic Search

**User's Journey:**
1. Search for entities by meaning, not just keywords
2. System finds semantically similar entities using vector embeddings

**Technical Flow:**
```
User query text
  ↓
Voyage AI: Generate embedding (1536-d vector)
  ↓
Supabase RPC: search_denizens_by_embedding()
  ↓
PostgreSQL (pgvector): Cosine similarity search
  ↓
Return denizens ordered by similarity
  ↓
Display results
```

**Key Components:**
- `src/lib/ai/vector-search.ts` - Vector search functions
- `supabase/migrations/*_vector_search_functions.sql` - RPC functions

---

## Data Flow

### Entity Data Structure

```typescript
Denizen {
  // Identity
  id, name, subtitle, type
  
  // Position
  position: { x, y }          // Canvas coordinates
  coordinates: {              // Semantic coordinates
    geometry, alterity, dynamics  // -1 to 1 each
  }
  
  // Classification
  allegiance, threatLevel, domain
  
  // Content
  description, lore, features, glyphs
  
  // Metaphysical
  phaseState, hallucinationIndex, 
  superposition, manifoldCurvature
  
  // Search
  embeddingSignature: [1536 numbers]  // Vector embedding
  
  // Media
  image, thumbnail, videoUrl
  
  // Relationships
  connections: [denizen_ids]
}
```

### Session Data (Archivist Conversations)

```typescript
ArchivistSession {
  id, user_id, denizen_id
  messages: [{ role, content, timestamp }]
  extracted_fields: { name, type, ... }
  status: 'in_progress' | 'completed' | 'abandoned'
  created_at, updated_at
}
```

---

## Key Systems

### 1. Authentication & Authorization

- **Supabase Auth** - User login/registration
- **Row Level Security (RLS)** - Database-level access control
- **Role-Based Access** - `user_roles` table (user, admin, archivist)
- **Server-Side Checks** - API routes verify admin status

### 2. AI Integration

- **Archivist (Claude)**: 
  - Maintains personality via system prompts
  - Extracts fields from conversation
  - Stores sessions in database for persistence

- **Media Analysis (Gemini)**:
  - Processes uploaded images/videos
  - Returns structured JSON with entity properties
  - Guides form auto-population

- **Embeddings (Voyage)**:
  - Generates 1536-dimensional vectors from text
  - Enables semantic similarity search
  - Stored in PostgreSQL as `vector(1536)` type

### 3. Vector Search

- **pgvector Extension** - PostgreSQL vector operations
- **IVFFlat Index** - Efficient similarity search
- **Cosine Distance** - Measure of semantic similarity
- **RPC Functions** - Database functions for search queries

### 4. Canvas Visualizations

- **Particle Systems** - Animated connections between entities
- **Data Readouts** - Visual representations of metaphysical properties
- **Real-Time Updates** - Canvas redraws as entity data changes

---

## File Structure

```
atlas/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (routes)/             # Public pages
│   │   ├── admin/                # Admin-only pages
│   │   │   ├── new-entity/       # Cataloguing interface
│   │   │   └── prompts/          # System prompts management
│   │   └── api/                  # API routes
│   │       ├── admin/            # Admin endpoints
│   │       └── archivist/        # Archivist chat API
│   ├── components/
│   │   ├── admin/                # Admin panel components
│   │   ├── constellation/        # Canvas view components
│   │   └── ui/                   # Shared UI (Navigation, etc.)
│   ├── lib/
│   │   ├── ai/                   # AI service clients
│   │   ├── archivist/            # Archivist logic
│   │   ├── auth/                 # Authentication utilities
│   │   └── types.ts              # TypeScript types
│   └── context/
│       └── AuthContext.tsx       # Auth state management
│
├── supabase/
│   └── migrations/               # Database migrations
│
├── design/
│   └── mockups/                  # HTML prototypes
│
└── public/                       # Static assets
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
ANTHROPIC_API_KEY=          # Claude
GOOGLE_GEMINI_API_KEY=      # Gemini
VOYAGE_API_KEY=             # Embeddings

# Replicate (Forge - Video Generation)
REPLICATE_API_TOKEN=        # Replicate API token
NEXT_PUBLIC_APP_URL=        # App URL for webhooks
```

---

## Summary

**Atlas is a full-stack web application that:**

1. **Stores** entity data in Supabase (PostgreSQL + Storage)
2. **Visualizes** entities in an interactive canvas view
3. **Catalogues** new entities through an AI-assisted admin panel
4. **Searches** semantically using vector embeddings
5. **Persists** AI conversations in the database
6. **Protects** admin features with role-based access control

**The stack is:**
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind
- Backend: Next.js API Routes + Supabase
- AI: Claude + Gemini + Voyage embeddings
- Database: PostgreSQL with pgvector for semantic search
- Storage: Supabase Storage for media files

**Key innovation:** The Archivist AI acts as an interface element, guiding users through cataloguing while maintaining conversation history in the database. Vector embeddings enable discovery of entities by meaning, not just keywords.

