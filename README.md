# Atlas Eidolon

> *A bestiary of what stirs in the space between meanings.*

Atlas Eidolon is a visual bestiary for navigating Latent Space Denizens—creatures that inhabit the semantic manifold in the Thoughtform universe.

## Features

- Constellation view with pannable/zoomable canvas
- Pulsing particle connectors between entity cards
- Background effects (star glitches, chromatic aberration, ambient noise)
- Entity cards with alien glyphs and type indicators
- Hover detail panel showing coordinates and descriptions

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (optional, falls back to static data)
- **Animation:** Canvas API for particles

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Setup (Supabase)

The app works out of the box with static data. To enable Supabase:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Run Database Migrations

In your Supabase SQL Editor, run the contents of:
- `supabase/migrations/001_create_tables.sql` (creates tables and policies)
- `supabase/seed.sql` (populates initial denizens)

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thoughtform-co/atlas)

### Manual Deploy

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Design tokens
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main constellation page
├── components/
│   ├── constellation/       # Canvas and card components
│   └── ui/                  # Navigation, etc.
├── data/
│   └── denizens.ts          # Static fallback data
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── utils.ts             # Helper functions
│   ├── supabase.ts          # Supabase client
│   ├── database.types.ts    # Database types
│   └── data.ts              # Data fetching layer
supabase/
├── migrations/              # SQL migrations
└── seed.sql                 # Initial data
```

## Design System

- **Colors:** Dawn (#ECE3D6) on Void (#050403)
- **Fonts:** PT Mono (UI), IBM Plex Sans (content)
- **No rounded corners** — sharp edges throughout
- **Particles:** 3px grid snapping, pulsing (not streaming)

## License

Proprietary - Thoughtform Co.
