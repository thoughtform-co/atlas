# Atlas Eidolon

> Thoughtform is the discipline of navigating the intelligence between thought and form. As the Navigator, I use Atlas to map visual worldbuilding as a semantic continuum rather than a static portfolio.

Over the past three years I have created over a hundred thousand images with Midjourney. Visual explorations of the denizens of the Latent Space: creatures, architectures, and entities that live in the space between meanings. I did an expo with some of this work in early 2025, but static outputs (prints, merchandise, NFTs) were never what interested me. I am interested in worldbuilding. In the wider territory, not the individual artifact.

The problem was that I had no system for understanding which art directions resonated, how styles clustered, or what the broader world being built actually looked like when mapped. Atlas exists to answer that question. Using the power of embeddings and feature extraction, it turns scattered creative output into a navigable cosmology.

The breakthrough came from Michael Levin's framing: intelligence is a continuum. What if the Atlas itself was a continuum you navigate? Creatures positioned along the gradient from human-adjacent to genuinely alien. The warm umber Starhaven Heralds closer to the real-world pole. The white brutalistic semantic entities inhabiting the deep latent space.

## What this enables

Navigate the semantic manifold of AI-generated entities. Each denizen is mapped with geometric coordinates, phase states, manifold curvature, and a hallucination index. Domains represent regions of the manifold. Connections reflect semantic proximity and are visualized as pulsing particle beams.

Cataloging a denizen is not data entry. It is semantic cartography: mapping each entity into the manifold with precise coordinates, phase states, and relationships. The AI Archivist (Claude + Gemini) analyzes uploaded media and suggests metaphysical parameters. Visual feedback is real-time. Exported cards capture the exact semantic state at a moment in time.

## Navigation surfaces

**Constellation view.** Canvas-based pan/zoom over the semantic manifold. Entity cards cluster by domain (e.g., "The Gradient Throne"). SREF codes enable style-based clustering, creating visual coherence across related entities. Pulsing particle connectors visualize semantic relationships.

**Entity detail.** Parameter controls for metaphysical properties (Superposition, Embedding Signature, Phase State, Manifold Curvature). Changes affect both data and visual manifestation in real-time, creating a feedback loop between representation and display.

**The Archivist.** AI assistant for entity analysis: upload media, receive parameter suggestions, extract structured data from natural language, explore entity relationships. Built on Claude and Gemini.

**Canvas export.** Renders directly to canvas for pixel-perfect fidelity. Bypasses DOM capture limitations. Preserves the full metaphysical configuration of the entity at the moment of export.

## The constellation

Atlas is the second repo in the Thoughtform brand world. It inherited the Dawn-on-Void palette and embedding-as-navigation paradigm from Astrolabe. It contributed the particle system that ultimately became the Three.js wormhole powering the Thoughtform.co hero animation. The Archivist AI system pioneered here evolved into the prompt enhancement architecture used in Sigil and a generation platform I built at Loop Earplugs.

Working on Atlas also refined brand elements that felt missing from the Astrolabe. And it introduced the Sentinel document pattern: evergreen development principles learned from real bugs, applied as a feedback loop.

**Sibling repos:** [Astrolabe](https://github.com/thoughtform-co/Astrolabe) (knowledge navigation), [Thoughtform.co](https://github.com/thoughtform-co/thoughtform) (brand interface), [Sigil](https://github.com/thoughtform-co/sigil) (creation and learning)

## Architecture

Next.js 16 (App Router), TypeScript, Tailwind CSS v4 with custom design tokens, Supabase (PostgreSQL) with optional static fallback, Canvas API for particles and visualizations, Claude + Gemini for entity analysis.

```
src/
  app/                    # Next.js App Router pages
    admin/                # Cataloging interface
    archive/              # Entity archive view
    lore/                 # Lore page
    api/                  # API routes
  components/
    constellation/        # Canvas and card components
    admin/                # Admin interface components
    ui/                   # Shared UI components
  lib/
    ai/                   # AI integration (Claude, Gemini)
    archivist/            # The Archivist AI system
    auth/                 # Authentication
    types.ts              # TypeScript interfaces

supabase/
  migrations/             # SQL migrations
  seed.sql                # Initial data
```

### Key concepts

**Denizens.** Entities with Class (taxonomic category), Type (behavioral: Guardian, Wanderer, Architect, Void-Born, Hybrid), Domain, Coordinates, and Metaphysical Parameters.

**Domains.** Regions of the semantic manifold. Entities cluster by domain. Domains can have SREF codes for style-based clustering.

**Connections.** Semantic relationships visualized as pulsing particle beams in the constellation view.

## Reliability

Follows the Sentinel pattern: auth gating, RLS policies on storage, configuration discipline. Canvas-first rendering for exports ensures pixel-perfect fidelity without DOM capture fragility. Inverted ref control prevents circular dependencies. CSS-only visual hints reduce GPU usage for non-critical indicators.

## Getting started

Prerequisites: Node.js 18+, npm.

The app works out of the box with static data. To enable the database layer:

1. Create a Supabase project and run the migrations in `supabase/migrations/` and `supabase/seed.sql`.

2. Configure your local project settings with the required database credentials.

3. Install and run:
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design system

Dawn (#ECE3D6) on Void (#050403). PT Mono for UI, IBM Plex Sans for content. Sharp edges throughout, no rounded corners. Particles on a 3px grid, pulsing rather than streaming. Glassmorphism for depth and layering.

## Current frontier

Exploring complex type support (full array/vector handling for Superposition and Embedding Signature), semantic search across the manifold via vectors, AI-suggested relationship inference based on semantic proximity, and temporal tracking of entity state evolution. The question is how deep the cataloging system goes before the worldbuilding shifts to narrative.
