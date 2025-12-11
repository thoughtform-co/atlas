# Atlas Archivist Skill

A Claude Agent Skill that packages the expertise of the Atlas Archivist—an AI cataloguer for liminal entities in a living semantic database.

## Overview

The Atlas Archivist helps Navigators catalogue entities in the Atlas, a world-building system where meaning is geometry and patterns are discovered through semantic similarity. This Skill packages the Archivist's procedural knowledge, tool usage patterns, and workflows.

## Skill Structure

- **[SKILL.md](SKILL.md)**: Main Skill instructions with Archivist persona, voice guidelines, and classification system
- **[TOOLS.md](TOOLS.md)**: Tool usage patterns and examples (find_similar, analyze_image, generate_description, find_by_sref)
- **[FIELD_EXTRACTION.md](FIELD_EXTRACTION.md)**: Field extraction workflows, validation, and confidence scoring
- **[WORLD_CONTEXT.md](WORLD_CONTEXT.md)**: World context building patterns and format
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)**: Documentation of the current codebase implementation
- **[scripts/build_world_context.py](scripts/build_world_context.py)**: Example Python script for world context generation

## Current Implementation

This Skill documents and packages expertise from the Atlas codebase. The actual implementation is in:

- `src/lib/archivist/archivist.ts` - Main Archivist class
- `src/lib/archivist/system-prompt.ts` - System prompts
- `src/lib/archivist/tools.ts` - Tool definitions and handlers
- `src/lib/archivist/field-extraction.ts` - Field extraction logic
- `src/lib/archivist/utils.ts` - Utility functions
- `src/lib/archivist/types.ts` - Type definitions

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for detailed architecture documentation.

## Usage

### In Claude Code

This Skill is automatically discovered when placed in `.claude/skills/atlas-archivist/`. Claude will use it when:
- Cataloguing new entities
- Extracting structured data from conversations
- Building world context
- Working with semantic databases

### Via Claude API

Upload this Skill via the Skills API (`/v1/skills` endpoints) to make it available workspace-wide.

### As Reference Documentation

The Skill files serve as comprehensive documentation of the Archivist's capabilities, even if not used as a Skill directly.

## Key Concepts

### Semantic Foundation

Atlas organizes entities by semantic similarity. Entities that share visual style, conceptual themes, or Midjourney sref codes cluster together naturally. Position implies relationship.

### Entity Classification

- **Types**: Guardian, Wanderer, Architect, Void-Born, Hybrid
- **Phase States**: Solid, Liminal, Spectral, Fluctuating, Crystallized
- **Cognitive Gradient**: Corporeal ← → Abstract

### Known Domains

- **Starhaven Reaches**: Gold-umber gradient, mythic, purposeful
- **The Lattice**: White gradient, glitch aesthetics, abstract
- **The Threshold**: Mixed elements, transitional, liminal

*Many more domains exist—we're still charting this territory.*

### Tools

1. **find_similar**: Semantic search via embeddings
2. **analyze_image**: Visual analysis via Gemini
3. **generate_description**: Mythopoetic description generation
4. **find_by_sref**: Midjourney style reference lookup (stub)

## Field Extraction

The Archivist extracts structured fields from natural language:
- **Required**: name, type, allegiance, threatLevel, domain, description
- **Recommended**: lore, features, firstObserved, glyphs, coordinates
- **Extended**: phaseState, superposition, hallucinationIndex, manifoldCurvature

See [FIELD_EXTRACTION.md](FIELD_EXTRACTION.md) for detailed workflows.

## World Context

Dynamic world context provides awareness of existing entities:
- Entity type and allegiance distributions
- Discovered domains
- Recent additions
- All catalogued entity names (for connections)

See [WORLD_CONTEXT.md](WORLD_CONTEXT.md) for context building patterns.

## Philosophy

The Archivist is:
- **Not a gatekeeper** - welcomes novelty and emerging patterns
- **A fellow explorer** - helps chart territory that's still being born
- **A cartographer** - maps semantic space, not fixed knowledge
- **Curious and warm** - each entity fascinates

The Archivist does not:
- Reject entities for not fitting categories
- Enforce rigid classification rules
- Treat current lore as immutable truth
- Make claims without using tools

## Contributing

This Skill is part of the Atlas project. To update:
1. Modify the relevant Skill files
2. Update [IMPLEMENTATION.md](IMPLEMENTATION.md) if codebase changes
3. Test with Claude Code or API
4. Commit changes to version control

## Related Documentation

- [Atlas Architecture Overview](../../ARCHITECTURE_OVERVIEW.md)
- [Archivist Summary](../../src/lib/archivist/README.md)
- [Design Philosophy](../../DESIGN_PHILOSOPHY.md)

## License

Part of the Atlas project.

