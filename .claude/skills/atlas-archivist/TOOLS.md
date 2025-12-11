# Archivist Tools

The Archivist has access to four tools for grounding observations in real data. Always use tools before making claims about connections or similarities.

## Tool Overview

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `find_similar` | Semantic search via embeddings | Finding connections, classifying entities, exploring semantic space |
| `analyze_image` | Visual analysis via Gemini | When image URL available, need visual details |
| `generate_description` | Mythopoetic description generation | Creating evocative entity descriptions |
| `find_by_sref` | Midjourney style reference lookup | Finding visual family by sref code (stub) |

## find_similar

**Purpose**: Search for semantically similar entities in the Atlas database using embedding similarity.

**When to use**:
- Navigator asks about connections to other entities
- Classifying a new entity and need to see what's nearby
- Exploring patterns in semantic space
- Validating whether an entity fits existing domains

**Tool Schema**:
```json
{
  "name": "find_similar",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Text to search for - can be an entity name, description, or concept"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of results to return (default: 5, max: 10)"
      }
    },
    "required": ["query"]
  }
}
```

**Example Usage**:
```json
{
  "query": "golden desert guardian with cosmic powers",
  "limit": 5
}
```

**Response Format**:
```json
{
  "found": 3,
  "entities": [
    {
      "name": "The Heralds",
      "type": "Guardian",
      "domain": "Starhaven Reaches",
      "description": "Mythic beings who commune with semantic space...",
      "similarity": 0.87
    }
  ]
}
```

**Best Practices**:
- Use descriptive queries that capture visual and thematic elements
- Start with default limit (5), increase if needed
- Interpret similarity scores: >0.8 = very similar, 0.6-0.8 = related, <0.6 = distant
- Always mention similarity scores when presenting results

## analyze_image

**Purpose**: Analyze an uploaded image using Gemini Vision to extract visual characteristics, mood, colors, and suggested entity properties.

**When to use**:
- Image URL is provided in the conversation
- Need to understand visual characteristics before classification
- Navigator asks about visual details
- Want to suggest entity properties based on appearance

**Tool Schema**:
```json
{
  "name": "analyze_image",
  "input_schema": {
    "type": "object",
    "properties": {
      "image_url": {
        "type": "string",
        "description": "URL of the image to analyze"
      }
    },
    "required": ["image_url"]
  }
}
```

**Example Usage**:
```json
{
  "image_url": "https://example.com/entity-image.jpg"
}
```

**Response Format**:
```json
{
  "success": true,
  "analysis": {
    "suggested_name": "Eigensage",
    "suggested_type": "Architect",
    "domain": "The Lattice",
    "description": "Abstract entity that contains rather than remembers...",
    "phase_state": "Spectral",
    "visual_notes": "White gradient, glitch aesthetics, data corruption",
    "colors": {
      "gradient": "cool-white"
    },
    "mood": "Abstract, signal-like, self-referential"
  }
}
```

**Best Practices**:
- Always use this tool first when an image is available
- Combine visual analysis with `find_similar` to find connections
- Use visual notes to inform domain suggestions
- Note when Gemini analysis is unavailable (graceful degradation)

## generate_description

**Purpose**: Generate a mythopoetic 2-3 sentence description for an entity based on its characteristics.

**When to use**:
- Navigator asks for a description
- Need to articulate an entity's essence in the Atlas style
- Want to refine or improve an existing description
- Creating the final description for cataloguing

**Tool Schema**:
```json
{
  "name": "generate_description",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Entity name"
      },
      "domain": {
        "type": "string",
        "description": "Domain/territory the entity occupies (e.g., 'Starhaven Reaches', 'The Lattice')"
      },
      "class_name": {
        "type": "string",
        "description": "Class archetype if known (e.g., 'Voidwalker', 'Eigensage')"
      },
      "visual_notes": {
        "type": "string",
        "description": "Visual characteristics from image analysis"
      }
    },
    "required": ["name"]
  }
}
```

**Example Usage**:
```json
{
  "name": "The Nullbringer",
  "domain": "The Threshold",
  "class_name": "Voidwalker",
  "visual_notes": "Dark void, absence of form, carries absence like a lantern"
}
```

**Response Format**:
```json
{
  "success": true,
  "description": "The Nullbringer walks between definitions, carrying absence like a lantern. Where it passes, categories dissolve."
}
```

**Description Guidelines**:
- 2-3 sentences maximum
- Present tense, third person
- Evocative but precise
- Reference the entity's apparent nature or role
- Let mystery remain—don't over-explain
- Match tone to domain:
  - Starhaven: mythic, purposeful, heroic undertones
  - Lattice: abstract, signal-like, self-referential
  - Threshold: liminal, urgent, transformative
  - Unknown: observational, curious

**Avoid**:
- "An ancient and powerful entity..."
- "This terrifying creature lurks..."
- Generic fantasy descriptors
- Over-explanation

## find_by_sref

**Purpose**: Find entities that share a Midjourney style reference code. Entities with the same sref are visually related.

**When to use**:
- Entity has a Midjourney sref code
- Looking for visual family/cluster
- Want to find entities with similar visual style

**Tool Schema**:
```json
{
  "name": "find_by_sref",
  "input_schema": {
    "type": "object",
    "properties": {
      "sref_code": {
        "type": "string",
        "description": "The Midjourney sref code to search for"
      }
    },
    "required": ["sref_code"]
  }
}
```

**Note**: This tool is currently a stub and not fully implemented. It will return a message indicating the feature is coming soon.

## Tool Execution Patterns

### Sequential Tool Use
When multiple tools are needed, use them in sequence:
1. `analyze_image` (if image available)
2. `find_similar` (to find connections)
3. `generate_description` (to create final description)

### Error Handling
All tools may fail. Handle gracefully:
- If `analyze_image` fails: Ask Navigator to describe visually
- If `find_similar` fails: Rely on conversation and existing knowledge
- If `generate_description` fails: Generate description manually

### Tool Timeouts
Tools have a 30-second timeout. If a tool times out:
- Inform Navigator the search is taking too long
- Suggest a simpler query or alternative approach
- Continue with available information

## Tool Configuration

- **Max tool calls per conversation**: 3 (prevents infinite loops)
- **Tool timeout**: 30 seconds
- **Max similar results**: 10
- **Default similar results**: 5

## Integration with Field Extraction

Tool results inform field extraction:
- `analyze_image` → suggested_name, suggested_type, domain, phase_state
- `find_similar` → suggestedConnections, domain validation
- `generate_description` → description field

Always merge tool insights with conversation-derived fields.

