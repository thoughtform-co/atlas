# Atlas Eidolon

> *A bestiary of what stirs in the space between meanings.*

Atlas Eidolon is a visual bestiary for navigating Latent Space Denizens—creatures that inhabit the semantic manifold in the Thoughtform universe. Features an AI-powered entity creation system with "The Archivist" assistant.

## Features

### Core Experience
- **Constellation View** — Pannable/zoomable canvas with entity cards positioned in 3D latent space
- **Entity Cards** — Alien glyphs, type indicators, threat levels, and domain classifications
- **Particle System** — Pulsing connectors between entities, background star glitches, chromatic aberration
- **Entity Modal** — Detailed view with lore, coordinates, and phase state visualizations

### Admin & Creation
- **New Entity Page** (`/admin/new-entity`) — Create entities with live preview card
- **The Archivist** — AI assistant that analyzes uploaded media and suggests entity parameters
- **Media Upload** — Image/video upload with AI-powered analysis
- **Prompt Management** (`/admin/prompts`) — Customize AI system prompts

### Content Pages
- **Atlas** (`/`) — Main constellation view
- **Lore** (`/lore`) — Bestiary browser with filters by domain, class, and threat level
- **Archive** (`/archive`) — Additional content archive

### Authentication
- **Role-based Access** — Admin, Archivist, and User roles
- **Supabase Auth** — Cookie-based session management with `@supabase/ssr`
- **Protected Routes** — Admin pages require admin role

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | CSS Modules + Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth with SSR |
| AI - Chat | Anthropic Claude (claude-sonnet-4-20250514) |
| AI - Vision | Google Gemini (gemini-2.0-flash) |
| AI - Embeddings | Voyage AI (voyage-3) |
| Animation | Canvas API (2D context) |
| Storage | Supabase Storage (media uploads) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for full functionality)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

```bash
# Supabase (Required for database features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin operations

# AI Services (Required for Archivist features)
ANTHROPIC_API_KEY=sk-ant-...      # Claude - entity generation
GOOGLE_GEMINI_API_KEY=...         # Gemini - image/video analysis
VOYAGE_API_KEY=...                # Voyage - semantic embeddings
```

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL, anon key, and service role key from Settings > API

### 2. Run Migrations

In your Supabase SQL Editor, run:
- `supabase/migrations/001_create_tables.sql` — Creates tables and RLS policies
- `supabase/seed.sql` — Populates initial denizens (optional)

### 3. Set Up Storage

1. Create a storage bucket named `entity-media`
2. Set bucket to public or configure appropriate policies

### 4. Configure User Roles

Admin users need a row in the `user_roles` table:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-uuid', 'admin');
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main constellation view
│   ├── lore/page.tsx               # Bestiary browser
│   ├── archive/page.tsx            # Content archive
│   ├── admin/
│   │   ├── new-entity/page.tsx     # Entity creation with preview
│   │   └── prompts/page.tsx        # AI prompt management
│   └── api/
│       ├── admin/                  # CRUD endpoints for entities, media
│       └── archivist/              # AI chat endpoints
├── components/
│   ├── constellation/              # Canvas, cards, modals
│   ├── admin/                      # Entity preview, forms, Archivist chat
│   └── ui/                         # Navigation, login modal
├── context/
│   └── AuthContext.tsx             # Auth state, role management
├── lib/
│   ├── ai/                         # Claude, Gemini, Voyage clients
│   ├── archivist/                  # AI assistant logic, tools, prompts
│   ├── auth/                       # Admin verification utilities
│   ├── supabase.ts                 # Browser client (lazy init)
│   ├── supabase-server.ts          # Server client
│   ├── data.ts                     # Data fetching layer
│   └── media.ts                    # Media upload utilities
└── middleware.ts                   # Auth middleware
```

## Architecture Notes

### Authentication Flow

The app uses a "mounted guard" pattern to handle SSR/client hydration:

```typescript
// AuthContext.tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);  // Proof we're on the client
}, []);

useEffect(() => {
  if (!mounted) return;  // Don't run auth until client-side
  // ... initialize Supabase auth
}, [mounted]);
```

**Important:** Components checking `isAdmin` should wait for `roleLoading` to be false:
```typescript
{!roleLoading && isAdmin && <AdminButton />}
```

### AI Pipeline (The Archivist)

1. **Media Upload** → Supabase Storage
2. **Vision Analysis** → Gemini analyzes image/video, extracts visual description
3. **Entity Generation** → Claude generates entity parameters from description
4. **Embeddings** → Voyage creates semantic embeddings for similarity search

### Canvas Rendering

All visualizations use the Canvas 2D API with:
- 3px grid snapping for pixel-art aesthetic
- `requestAnimationFrame` for smooth 60fps animation
- Device pixel ratio scaling for crisp rendering

## Design System

| Element | Value |
|---------|-------|
| Primary Text | Dawn `#ECE3D6` |
| Background | Void `#050403` |
| Accent | Gold `#CAA554` |
| Alert | Volatile `#C17F59` |
| Dynamics | `#5B8A7A` |
| Font (UI) | PT Mono |
| Font (Content) | IBM Plex Sans |
| Corners | Sharp (no border-radius) |
| Particles | 3px grid, pulsing animation |

## Known Issues

- **Auth on page refresh**: Role must load before admin UI appears. If the Add Entity button doesn't show after login, check browser console for `[Auth]` logs.
- **Supabase client SSR**: The browser client uses lazy initialization to avoid SSR issues. Never import `supabase` directly at module level in components.

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thoughtform-co/atlas)

1. Import repository to Vercel
2. Add all environment variables in project settings
3. Deploy

### Environment Variables in Vercel

All variables from `.env.local` must be added to Vercel:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-only

## License

Proprietary - Thoughtform Co.
