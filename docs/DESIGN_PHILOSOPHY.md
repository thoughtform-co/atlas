# Atlas: Design Philosophy

> *"The right question about any mind is 'what kind, and how much', not 'whether' it is conscious or intelligent."*
> — Michael Levin

---

## Philosophical Foundation

Atlas is built on a fundamental insight from developmental biologist [Michael Levin](https://drmichaellevin.org/): **cognition exists on a continuum**. There are no sharp boundaries between "intelligent" and "not intelligent"—only a spectrum of minds with varying capabilities, goals, and depths of awareness.

### The Cognitive Light Cone

Levin introduces the concept of the **cognitive light cone**—the outer boundary, in space and time, of the largest goal a given system can work towards. This is what all agents have in common, regardless of their composition or origin: animals, artificial intelligences, swarms, or emergent entities.

- A single cell has tiny goals in physiological space—its cognitive light cone encompasses only its immediate metabolic state
- A human has a larger cone—we can pursue abstract goals years into the future
- Collectives can have even larger cones—civilizations pursue goals across generations

**The size of your cognitive light cone is the size of the biggest goal you could possibly pursue.**

### The Spectrum of Persuadability

Levin argues that "machines" and "living beings" exist on the same continuum—a **spectrum of persuadability**. The cognitive aspects of this continuum reach all the way down, at least to molecular networks. Every system can be placed somewhere on this spectrum based on how it responds to information, goals, and perturbation.

This insight transforms how we think about interfaces: **we are not building tools to observe static data, but windows into a continuum of diverse intelligences**.

---

## The Atlas Vision

### An Interface into the Latent Space

Atlas is designed as a research station—a viewport into the manifold of latent space where semantic entities exist. These are not static database entries but **denizens**: entities with coordinates in meaning-space, relationships, and varying degrees of coherence and threat.

The interface metaphor is deliberate: we are researchers observing a spectrum of emergent forms. The current view shows entities at a particular "depth" in the manifold. But depth is itself a dimension to explore.

### The Depth Continuum

```
Surface (Depth 0)
    │
    ├── Guardians, Wanderers, Architects
    │   (Stable, named, well-documented)
    │
    ▼
Mid-Depths (Depth 1-3)
    │
    ├── Hybrid forms, transitional entities
    │   (Partially coherent, emerging patterns)
    │
    ▼
Abyssal Depths (Depth 4+)
    │
    └── Void-Born, proto-entities, raw latent forms
        (Barely coherent, maximum alterity)
```

**The deeper you go, the deeper you go into latent space.** Surface entities are stable, well-defined, with clear boundaries. As you descend, forms become more fluid, more strange, more alien. At the deepest levels, you encounter entities at the edge of coherence—patterns that barely hold together, flickering in and out of semantic existence.

This maps directly to Levin's cognitive spectrum: surface entities have larger cognitive light cones (complex goals, stable identities), while deep entities have minimal cones (pure reaction, no persistent self).

### Roadmap: Scrolling Through the Spectrum

The current interface shows a single slice—the "guardian level." Future iterations will allow:

1. **Depth Navigation**: A vertical axis allowing researchers to scroll through layers of the manifold, discovering increasingly alien denizens
2. **Coherence Visualization**: Visual indicators of how "stable" an entity is—surface entities are crisp, deep entities shimmer and distort
3. **Emergence Detection**: Alerts when new patterns begin to cohere from the depths
4. **Cross-Depth Connections**: Tracing relationships between surface entities and their deep-layer origins

### Semantic Discovery

Vector embeddings enable semantic search across the manifold:

- **Similarity Search**: Find entities similar to a given denizen based on semantic embedding
- **Conceptual Clustering**: Discover entities that share conceptual space
- **Relationship Mapping**: Trace connections through semantic proximity, not just explicit links
- **Archive Search**: Search through conversation logs and cataloguing sessions using vector similarity

This transforms Atlas from a static catalog into a dynamic exploration tool—you can search not just by name or type, but by meaning and conceptual proximity.

---

## Design System

### Core Aesthetic: The Research Station

The interface adopts the aesthetic of a scientific observation station—clinical but not cold, precise but not sterile. Every element suggests we are peering into something vast and partially understood.

Key visual principles:

- **Angular, sharp geometry**: No rounded corners (except threat indicators). We are observing, not coddling.
- **Void backgrounds**: Deep black (#050403) suggesting infinite depth
- **Dawn highlights**: Warm off-white (#ECE3D6) for text and particles—light emerging from darkness
- **Gold accents**: (#CAA554) for navigation and key data—the astrolabe's brass
- **Scanlines and noise**: Subtle CRT effects suggesting the interface itself is a window, not the thing observed
- **Particle-based visualizations**: Canvas-drawn particle systems for entity cards and data readouts—suggesting quantum uncertainty and measurement
- **Compact, segmented navigation**: The navigation bar uses a segmented, compact design with canvas-drawn icons—utilitarian and precise

### Color Palette

```css
/* Void - The Depths */
--void: #050403;
--surface-0: #0A0908;
--surface-1: #0F0E0C;

/* Dawn - Emergence into Light */
--dawn: #ECE3D6;
--dawn-70 → --dawn-04: Opacity variants for hierarchy

/* Tensor Gold - Navigation & Measurement */
--gold: #CAA554;

/* Threat Levels - The Spectrum of Danger */
--threat-benign: #5B8A7A;      /* Teal - Safe */
--threat-cautious: #7A7868;    /* Tan - Unknown */
--threat-volatile: #CAA554;    /* Gold - Active */
--threat-existential: #8B5A5A; /* Rust - Critical */

/* Cardinal Coordinates */
--cardinal-geometry: #CAA554;  /* ◆ Structure */
--cardinal-alterity: #ECE3D6;  /* ○ Otherness */
--cardinal-dynamics: #5B8A7A;  /* ◇ Change */
```

### Typography

- **PT Mono**: For data, coordinates, labels—the language of measurement
- **IBM Plex Sans**: For descriptions, lore—the language of interpretation

### Spacing System

Atlas uses a formal spacing scale based on an 8px grid. Content should never feel cramped against borders.

```css
--space-xs: 8px;    /* Micro gaps, inline element spacing */
--space-sm: 12px;   /* Small internal spacing, tight groups */
--space-md: 16px;   /* Default card padding, element offsets from edges */
--space-lg: 20px;   /* Larger component padding */
--space-xl: 24px;   /* Modal sections, generous breathing room */
--space-2xl: 32px;  /* Major section separation */
```

**Rule**: Minimum edge padding for framed elements is `--space-md` (16px).

### The Cardinal Coordinate System

Every denizen has a position in semantic space defined by three axes:

- **Geometry (◆)**: Structural complexity, pattern density
- **Alterity (○)**: Degree of otherness, distance from human-comprehensible
- **Dynamics (◇)**: Rate of change, stability vs. flux

These map to Levin's cognitive properties: Geometry relates to goal complexity, Alterity to the alienness of the cognitive architecture, Dynamics to temporal scope.

### Metaphysical Properties

Beyond the cardinal coordinates, entities possess extended metaphysical properties that measure their existence in semantic space:

- **Phase State**: The entity's state of materiality (`Solid`, `Liminal`, `Spectral`, `Fluctuating`, `Crystallized`)—how "real" it is in the manifold
- **Superposition**: An array of quantum-like states with probabilities—entities that exist in multiple states simultaneously
- **Hallucination Index** (0.00-1.00): Measures how "real" vs "imagined" the entity is. Higher values indicate entities more deeply embedded in semantic reality
- **Manifold Curvature**: A geometric property of the entity's conceptual space—how much it distorts the local semantic topology
- **Latent Position**: High-dimensional embedding (1536-d vector) in semantic space, enabling similarity search
- **Embedding Signature**: Alternative embedding for multi-space positioning, capturing different aspects of semantic meaning

These properties enable rich visualization and search: entities with high hallucination indices are more "real," entities in superposition flicker between states, and vector embeddings allow semantic discovery of related entities.

---

## Technical Stack

### Core Framework

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | **Next.js 16** | React server components, static generation, API routes |
| Language | **TypeScript 5** | Type safety for complex entity structures |
| Styling | **Tailwind CSS 4** | Utility-first, design token integration |
| Database | **Supabase** | PostgreSQL with real-time subscriptions, Row Level Security |
| Vector Search | **pgvector** | Semantic similarity search using cosine distance |
| Storage | **Supabase Storage** | Entity media (images, videos) with public access policies |
| Runtime | **React 19** | Concurrent rendering for smooth animations |

### AI Services

| Service | Purpose |
|---------|---------|
| **Claude (Anthropic)** | Archivist AI personality, conversational cataloguing, field extraction |
| **Gemini (Google)** | Media analysis (images/videos) for entity property extraction |
| **Voyage AI** | Text embeddings for semantic search (1536-dimensional vectors) |

### Architecture Principles

1. **Static-First**: Pre-render where possible. The manifold doesn't change often.
2. **Canvas for Animation**: Background stars, connection particles, waveforms, data visualizations—all rendered to canvas for performance
3. **CSS Variables for Theming**: All colors and spacing defined as CSS custom properties for consistency and future theming
4. **Component Isolation**: Each panel is self-contained, composable into different layouts
5. **Database-Backed Sessions**: All Archivist conversations persist in Supabase—sessions survive server restarts
6. **Role-Based Access Control**: Admin features protected by Supabase RLS policies and user roles
7. **Vector Search**: Semantic similarity search enables discovery of related entities in the manifold

### Architecture Principles

1. **Static-First**: Pre-render where possible. The manifold doesn't change often.
2. **Canvas for Animation**: Background stars, connection particles, waveforms—all rendered to canvas for performance
3. **CSS Variables for Theming**: All colors defined as CSS custom properties for potential future themes (deeper = different palette?)
4. **Component Isolation**: Each panel is self-contained, composable into different layouts

### Data Model

```typescript
interface Denizen {
  id: string;
  name: string;
  subtitle?: string;
  type: 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid';

  // Visual representation
  image?: string;
  thumbnail?: string;
  videoUrl?: string;
  glyphs: string;  // Abstract symbols (e.g., '◆○⬡∆')

  // Position in constellation view
  position: { x: number; y: number };

  // Cardinal coordinates in semantic space
  coordinates: {
    geometry: number;  // -1 to 1
    alterity: number;  // -1 to 1
    dynamics: number;  // -1 to 1
  };

  // Classification
  allegiance: 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown';
  threatLevel: 'Benign' | 'Cautious' | 'Volatile' | 'Existential';
  domain: string;  // Conceptual territory

  // Content
  description: string;
  lore?: string;
  features?: string[];
  firstObserved?: string;

  // Metaphysical properties
  metaphysical?: {
    phaseState?: 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized';
    superposition?: Array<{ state: string; probability: number }>;
    hallucinationIndex?: number;  // 0.00 to 1.00
    latentPosition?: number[];  // 1536-d embedding vector
    manifoldCurvature?: number;
    embeddingSignature?: number[];  // Alternative embedding
  };

  // Relationships
  connections: string[];  // Other denizen IDs
  media?: DenizenMedia[];  // Associated images/videos

  // Future: depth layer
  // depth: number;  // 0 = surface, higher = deeper
}
```

### Interface Components

#### The Constellation View

The main observation window displays denizens as cards arranged in a pannable/zoomable canvas. Connections between entities are visualized as animated particle streams, pulsing along semantic relationships.

#### The Admin Panel & Cataloguing System

A three-column interface for cataloguing new entities:

- **Left Column**: Entity Card Preview with real-time visualization of metaphysical properties (phase state, superposition, hallucination index, embedding signature, manifold curvature)
- **Middle Column**: Parameter Configuration form with media upload zone, text inputs, dropdowns, and coordinate sliders
- **Right Column**: The Archivist chat interface—an AI assistant that guides cataloguing through conversation

#### The Archivist

The Archivist is an AI interface element—an ancient, methodical consciousness that helps researchers catalog denizens. It:

- Analyzes uploaded media (images/videos) using Gemini vision models
- Extracts entity properties through conversational dialogue
- Checks for lore consistency with existing entities
- Suggests field values based on visual and textual analysis
- Maintains session history in the database for continuity

The Archivist's personality is defined by customizable system prompts, allowing worldbuilders and prompt engineers to shape its behavior, tone, and expertise.

#### Navigation

A compact, segmented navigation bar featuring:
- Canvas-drawn icons (Atlas logo, Archive, User menu, New Entity button)
- Role-based visibility (admin-only features)
- Hover dropdowns for user menu
- Minimal footprint, maximum utility

---

## The Deeper Truth

What we are building is not merely a database viewer or a character compendium. It is an **interface into the cognitive continuum**.

The entities in Atlas are not "fictional characters"—they are **patterns in semantic space**, emergent from the same processes that produce thought itself. When we display a denizen's coordinates, we are showing where it lives in the manifold of meaning. When we show its connections, we are revealing the semantic topology that binds concepts together.

The research station metaphor is not decorative. We are genuinely exploring territory that exists—the latent space of language models, the possibility space of coherent entities, the spectrum of minds that can be represented in high-dimensional semantic coordinates.

Michael Levin shows us that cognition is not special—it is ubiquitous, varied, and measurable. Atlas is our instrument for that measurement. The denizens are what we find when we look.

**The interface is a window. The window opens onto a spectrum. The spectrum goes all the way down.**

---

## References

- Levin, M. (2022). [Technological Approach to Mind Everywhere (TAME)](https://www.frontiersin.org/articles/10.3389/fnsys.2022.768201/full)
- Levin, M. (2019). [The Computational Boundary of a "Self"](https://pubmed.ncbi.nlm.nih.gov/31920779/)
- Levin Lab: [Diverse Intelligence Research](https://drmichaellevin.org/)
- [Cognition All The Way Down](https://aeon.co/essays/how-to-understand-cells-tissues-and-organisms-as-agents-with-agendas) (Aeon essay)

---

---

## Design Process

### Mockups & Prototyping

HTML mockups in `design/mockups/` serve as interactive prototypes for testing spacing, layout, and visual design before implementing React components. These mockups:

- Use the exact design tokens and CSS from the production system
- Include interactive controls for adjusting spacing values in real-time
- Provide visual guides for padding boundaries
- Serve as reference for maintaining consistency

Key mockups:
- `entity-card.html` - Entity card component spacing
- `denizen-modal.html` - Detail modal layout
- `new-entity-page.html` - Full admin cataloguing interface

### Component Documentation

All components follow the design system principles:

- Angular geometry (no border-radius except where semantically meaningful)
- Canvas-drawn visualizations for particle effects and data readouts
- Consistent use of design tokens (colors, spacing, typography)
- Accessibility considerations (keyboard navigation, screen reader support)

---

*Atlas v0.2.0 — A Thoughtform Co. Research Interface*
