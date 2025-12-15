# Atlas Eidolon

> A bestiary of what stirs in the space between meanings.

Atlas Eidolon is a visual bestiary for navigating **Latent Space Denizens**—creatures that inhabit the semantic manifold in the Thoughtform universe. It serves as both a cataloging system and an exploration interface for entities that exist in the liminal space between language, meaning, and representation.

---

## Philosophy

### The Semantic Manifold

In the Thoughtform universe, meaning exists as a topological space—a **semantic manifold** where concepts, entities, and relationships form a continuous, navigable landscape. Denizens are not static entries but dynamic entities that exist across multiple dimensions of meaning:

- **Geometric Coordinates**: Position in the semantic space (geometry, alterity, dynamics)
- **Phase States**: Material presence (Solid, Liminal, Spectral, Fluctuating, Crystallized)
- **Manifold Curvature**: Local distortion of semantic space (Stable, Moderate, Severe, Critical)
- **Hallucination Index**: Degree of semantic instability
- **Superposition**: Quantum-like state of multiple simultaneous meanings
- **Embedding Signature**: Unique fingerprint in the latent space

### Semantic Interfaces

Atlas Eidolon uses **semantic interfaces**—UI patterns that directly map to and manipulate the underlying semantic structure:

1. **Constellation View**: The visual representation of the semantic manifold, where entities cluster by domain and connect through semantic relationships. Panning and zooming navigate the semantic space itself.

2. **Parameter Controls**: Direct manipulation of metaphysical parameters that affect both the entity's data and its visual manifestation. Changing Superposition or Embedding Signature updates animations in real-time, creating a feedback loop between data and representation.

3. **Domain Clustering**: Entities are organized by semantic domains (e.g., "The Gradient Throne"), which represent regions of the semantic manifold. SREF codes (Style Reference) enable style-based clustering, creating visual coherence across related entities.

4. **Canvas-Based Rendering**: Export functionality uses canvas rendering to capture the exact semantic state of an entity at a moment in time, preserving the full metaphysical configuration in pixel-perfect exports.

### The Cataloging Workflow

Cataloging a denizen is not just data entry—it's **semantic cartography**. Each entity is mapped into the semantic manifold with precise coordinates, phase states, and relationships. The system supports:

- **AI-Assisted Analysis**: The Archivist (AI system) analyzes media and suggests metaphysical parameters
- **Visual Feedback**: Real-time preview of how parameters affect entity manifestation
- **Relationship Mapping**: Connections between entities reflect semantic proximity
- **Export as Documentation**: Professional-grade exports capture entities for external use

---

## Roadmap

### Phase 1: Foundation ✓
- Core constellation view with pan/zoom
- Entity card system with metaphysical parameters
- Basic cataloging interface
- Supabase integration

### Phase 2: Semantic Interfaces ✓
- Domain-based clustering with SREF codes
- Parameter controls with real-time animation feedback
- Multi-media support with floating card system
- Canvas-based export system for pixel-perfect fidelity

### Phase 3: AI Integration ✓
- The Archivist AI assistant for entity analysis
- Media analysis and parameter suggestion
- System prompt orchestration
- Field extraction from natural language

### Phase 4: Refinement (Current)
- Streamlined cataloging workflow
- Consistent UI patterns across all interfaces
- Entity class management with inline editing
- Video auto-play on hover for better preview
- Performance optimizations

### Phase 5: Advanced Semantic Features (Planned)
- **Complex Type Support**: Full array/vector support for Superposition and Embedding Signature
- **Semantic Search**: Vector-based search across the semantic manifold
- **Relationship Inference**: AI-suggested connections based on semantic proximity
- **Temporal Tracking**: Version history of entity states over time
- **Export Enhancements**: Batch exports, custom formats, animation presets

### Phase 6: Collaborative Features (Future)
- Multi-user cataloging with conflict resolution
- Shared semantic spaces
- Entity templates and inheritance
- Community domain contributions

---

## Architecture Principles

### Canvas-First for Exports
Export-critical components render directly to canvas, ensuring pixel-perfect fidelity. This approach bypasses DOM capture limitations and guarantees that exported media matches the display exactly.

### Inverted Control for Refs
Parent components own refs and provide them to children, preventing circular dependencies and infinite render loops. This pattern ensures stable component hierarchies.

### Performance-First Visual Feedback
Visual indicators use CSS-only styling instead of full component rendering when possible. This reduces bandwidth, GPU usage, and render complexity while maintaining user feedback.

### Semantic Data Model
The data model directly reflects the semantic manifold structure:
- Entities have coordinates in semantic space
- Domains represent regions of the manifold
- Connections reflect semantic relationships
- Parameters control both data and visual manifestation

---

## Technical Stack

**Framework**: Next.js 16 (App Router)  
**Language**: TypeScript  
**Styling**: Tailwind CSS v4 with custom design tokens  
**Database**: Supabase (PostgreSQL) with optional static fallback  
**Animation**: Canvas API for particles and visualizations  
**AI**: Anthropic Claude + Google Gemini for entity analysis

---

## Design System

**Colors**: Dawn (#ECE3D6) on Void (#050403)  
**Fonts**: PT Mono (UI), IBM Plex Sans (content)  
**Aesthetics**: Sharp edges, no rounded corners—geometric precision  
**Particles**: 3px grid snapping, pulsing (not streaming)  
**Glassmorphism**: Backdrop blur effects for depth and layering

---

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

Open http://localhost:3000 to see the app.

### Database Setup (Supabase)

The app works out of the box with static data. To enable Supabase:

1. **Create a Supabase Project**
   - Go to supabase.com and create a new project
   - Note your project URL and anon key from Settings > API

2. **Run Database Migrations**
   - In your Supabase SQL Editor, run the contents of:
     - `supabase/migrations/001_create_tables.sql` (creates tables and policies)
     - `supabase/seed.sql` (populates initial denizens)

3. **Configure Environment Variables**
   ```bash
   # Copy example env file
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Deploy to Vercel

**One-Click Deploy**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Manual Deploy**:
1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

---

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── admin/               # Cataloging interface
│   ├── archive/             # Entity archive view
│   ├── lore/                # Lore page
│   └── api/                 # API routes
├── components/
│   ├── constellation/       # Canvas and card components
│   ├── admin/               # Admin interface components
│   └── ui/                  # Shared UI components
├── lib/
│   ├── ai/                  # AI integration (Claude, Gemini)
│   ├── archivist/           # The Archivist AI system
│   ├── auth/                # Authentication
│   └── types.ts             # TypeScript interfaces
└── supabase/
    ├── migrations/          # SQL migrations
    └── seed.sql             # Initial data
```

---

## Key Concepts

### Denizens
Entities that exist in the semantic manifold. Each denizen has:
- **Class**: Taxonomic category (e.g., "Eigensage", "Nullseer")
- **Type**: Behavioral classification (Guardian, Wanderer, Architect, Void-Born, Hybrid)
- **Domain**: Semantic region they inhabit
- **Coordinates**: Position in semantic space
- **Metaphysical Parameters**: Phase state, manifold curvature, etc.

### Domains
Regions of the semantic manifold. Entities cluster by domain, creating visual and semantic coherence. Domains can have SREF codes for style-based clustering.

### Connections
Semantic relationships between entities. Connections are visualized as pulsing particle beams in the constellation view, representing proximity in the semantic manifold.

### The Archivist
AI assistant that helps catalog entities by:
- Analyzing uploaded media
- Suggesting metaphysical parameters
- Extracting structured data from natural language
- Answering questions about entity relationships

---

## Contributing

This is a proprietary project by Thoughtform Co. For internal contributors, see the development guidelines in `docs/`.

---

## License

Proprietary - Thoughtform Co.

---

## Related Projects

- **Thoughtform Universe**: The broader narrative and world-building system
- **Semantic Cartography Tools**: Other tools for navigating semantic spaces
