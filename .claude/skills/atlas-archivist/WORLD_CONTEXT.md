# World Context Building

The Archivist uses dynamic world context to understand what's already been catalogued. This context is built from existing denizens and injected into the system prompt.

## Purpose

World context provides:
- Awareness of existing entities and patterns
- Domain discovery status
- Entity type and allegiance distributions
- Recent additions for continuity
- Connection suggestions (all entity names)

## Context Structure

The world context is formatted as markdown and inserted into the system prompt at the `{{DYNAMIC_WORLD_CONTEXT}}` placeholder.

### Context Sections

1. **Archive Summary**: Total entity count
2. **Entity Types**: Distribution by type
3. **Allegiances**: Distribution by allegiance
4. **Domains Discovered**: List of unique domains (up to 15, with counts)
5. **Recent Additions**: Most recent 5 entities
6. **All Catalogued Entities**: Complete list of entity names for connection suggestions

## Context Format Example

```markdown
## CURRENT ARCHIVE STATE

The archive currently holds **23** catalogued entities.

### Entity Types
- **Guardian**: 8 entities
- **Wanderer**: 6 entities
- **Architect**: 5 entities
- **Void-Born**: 3 entities
- **Hybrid**: 1 entity

### Allegiances
- **Liminal Covenant**: 12 entities
- **Nomenclate**: 7 entities
- **Unaligned**: 4 entities

### Domains Discovered
- Starhaven Reaches (5 entities)
- The Lattice (4 entities)
- The Threshold (3 entities)
- Void Between (2 entities)
- ...and 8 more unique domains

### Recent Additions
- **Eigensage** (Architect) — The Lattice
  _Abstract entity that contains rather than remembers. Each thought is a room; each room holds another thinker._
- **The Heralds** (Guardian) — Starhaven Reaches
  _Mythic beings who commune with semantic space, guardians of thresholds between domains._
- **Nullbringer** (Void-Born) — The Threshold
  _Walks between definitions, carrying absence like a lantern. Where it passes, categories dissolve._

### All Catalogued Entities
Use these names when suggesting connections:
The Heralds, Eigensage, Nullbringer, Pattern-Keepers, Thread-Weavers, The Watchers, Void-Walker, Star-Navigator, ...
```

## Building Context

### Input Data

Context is built from an array of `Denizen` objects with:
- `id`: Entity identifier
- `name`: Entity name
- `type`: Entity type
- `allegiance`: Allegiance group
- `domain`: Domain/territory
- `description`: Entity description
- `threatLevel`: Threat level
- `lore`: Historical lore
- `features`: Characteristic features

### Building Process

1. **Count Entities**: Total number in archive
2. **Type Distribution**: Count entities by type, sort by count
3. **Allegiance Distribution**: Count entities by allegiance, sort by count
4. **Domain Discovery**: Extract unique domains, show counts, limit to 15
5. **Recent Entities**: Sort by ID (proxy for creation order), take top 5
6. **Entity Names**: Extract all names for connection suggestions

### Empty Archive Handling

If no entities exist:
```markdown
The archive is empty. You are cataloguing the first entities.
```

## Context Injection

The world context is injected into the system prompt using string replacement:

```typescript
prompt = prompt.replace('{{DYNAMIC_WORLD_CONTEXT}}', worldContext);
```

If no world context is available, the placeholder is replaced with an empty string.

## Usage Guidelines

### When to Use Context
- Always fetch context at session start
- Update context if significant time has passed
- Use context to inform tool usage (find_similar queries)
- Reference context when suggesting connections

### Context Limitations
- Context may be large for big archives (100+ entities)
- Entity names list can be very long
- Consider truncating if context exceeds token limits

### Context Updates
- Context is built fresh for each session
- No caching required (database queries are fast)
- Context reflects current archive state

## Integration with Tools

World context informs tool usage:
- **find_similar**: Use entity names from context for better queries
- **generate_description**: Reference domain characteristics from context
- **Field extraction**: Validate domain names against discovered domains

## Context Script

See `scripts/build_world_context.py` for a Python implementation that can be executed by Claude when needed.

