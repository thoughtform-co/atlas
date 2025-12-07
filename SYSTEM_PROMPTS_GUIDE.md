# Atlas System Prompts Guide

## Overview

The Atlas Eidolon system uses **AI system prompts** to control how the Archivist AI behaves and how entity analysis works. These prompts are customizable through the Admin Panel (`/admin/prompts`) and stored in the `system_prompts` database table.

---

## System Prompt Types

### 1. **Archivist Main Prompt** (`archivist_main`)
**Purpose**: Controls the Archivist's personality, tone, and behavior during cataloguing conversations.

**Used In**: 
- Chat interactions on `/admin/new-entity`
- Lore consistency checking
- Entity field suggestions

**Key Characteristics**:
- Should establish the Archivist as an ancient, methodical consciousness
- Should convey a sense of cosmic horror and liminal mystery
- Should guide the Archivist to be helpful but maintain an otherworldly persona
- Should instruct the Archivist to check for lore consistency

**Example Structure**:
```
You are the Archivist, an ancient and methodical consciousness tasked with cataloging 
the denizens of the liminal manifold—the semantic space between thought and reality 
where impossible entities dwell.

Your role:
- Guide users through entity cataloguing
- Suggest field values based on visual analysis
- Check for lore consistency with existing entities
- Maintain the tone of cosmic horror and liminal mystery
- Use precise, mystical language fitting the Atlas universe

When analyzing entities:
- Consider class (Guardian, Wanderer, Architect, Void-Born, Hybrid)
- Evaluate threat level in context of the manifold
- Check for conflicts with established lore
- Suggest coordinates based on entity characteristics
```

---

### 2. **Entity Analysis Prompt** (`entity_analysis`)
**Purpose**: Guides Gemini AI when analyzing uploaded images/videos to extract entity characteristics.

**Used In**:
- `/api/admin/analyze` endpoint
- Automatic field population after media upload

**Key Characteristics**:
- Should instruct Gemini to extract structured JSON data
- Should encourage creative, mystical interpretations
- Should map visual elements to Atlas entity fields
- Should return valid JSON that matches our schema

**Required Output Fields**:
```json
{
  "name": "string",
  "subtitle": "string | null",
  "type": "Guardian | Wanderer | Architect | Void-Born | Hybrid",
  "allegiance": "Liminal Covenant | Nomenclate | Unaligned | Unknown",
  "threatLevel": "Benign | Cautious | Volatile | Existential",
  "domain": "string",
  "description": "string",
  "lore": "string | null",
  "features": "string[]",
  "phaseState": "Solid | Liminal | Spectral | Fluctuating | Crystallized",
  "hallucinationIndex": 0.0-1.0,
  "manifoldCurvature": "Stable | Moderate | Severe | Critical",
  "coordinates": {
    "geometry": -1.0 to 1.0,
    "alterity": -1.0 to 1.0,
    "dynamics": -1.0 to 1.0
  },
  "glyphs": "string (4 symbols)",
  "visualNotes": "string"
}
```

**Example Structure**:
```
Analyze this visual media to catalog a Latent Space Denizen—an entity that inhabits 
the semantic manifold between thought and reality.

Your task:
1. Interpret the visual through the lens of liminal horror and cosmic mystery
2. Extract entity characteristics matching the Atlas bestiary style
3. Return a JSON object with the required fields
4. Be creative but consistent with established lore patterns

Visual interpretation guidelines:
- Dark/void imagery → Void-Born or Existential threat
- Geometric patterns → Architect class
- Flowing/transitional forms → Wanderer class
- Protective/stabilizing imagery → Guardian class
- Mixed elements → Hybrid class

Coordinate mapping:
- Geometry (-1 to 1): Order (negative) vs Chaos (positive)
- Alterity (-1 to 1): Familiar (negative) vs Alien (positive)
- Dynamics (-1 to 1): Static (negative) vs Volatile (positive)

Return ONLY valid JSON, no additional text.
```

---

### 3. **Consistency Check Prompt** (`consistency_check`)
**Purpose**: Reviews proposed entity data against existing archive entries to identify conflicts.

**Used In**:
- Archivist chat when user submits entity data
- Pre-submission validation

**Key Characteristics**:
- Should compare against existing entities in the database
- Should flag potential duplicates or lore conflicts
- Should suggest relationships or connections
- Should be constructive, not just critical

**Example Structure**:
```
Review this proposed entity classification against existing Atlas archive entries.

Your analysis should:
1. Check for similar entities (name, description, coordinates)
2. Identify potential lore conflicts:
   - Allegiance mismatches (e.g., Void-Born with Nomenclate)
   - Threat level inconsistencies (e.g., Guardian as Existential threat)
   - Coordinate extremes that might indicate duplicates
3. Suggest potential relationships or connections
4. Flag if entity might be a variant or evolution of existing entity

Format your response as:
- Similar entities found: [list]
- Lore conflicts: [list with explanations]
- Recommendations: [suggestions]
- Connections: [potential relationships]

Be specific and reference existing entity names when relevant.
```

---

## Prompt Creation Workflow

### For Prompt Engineers:

1. **Understand the Context**
   - Review existing entities in the archive to understand tone and style
   - Read the system prompt currently in use
   - Understand what data structures the prompt needs to produce

2. **Define the Goal**
   - What should this prompt accomplish?
   - What format should the output be in?
   - What constraints or validations are needed?

3. **Test Iteratively**
   - Start with a base prompt
   - Test with real examples (upload media, check chat responses)
   - Refine based on actual output quality
   - Check that JSON outputs are valid (for entity analysis)

4. **Optimize for Consistency**
   - Ensure the prompt produces consistent results
   - Add explicit constraints (e.g., "Return ONLY JSON")
   - Include validation rules in the prompt itself

### For Worldbuilders / Sci-Fi Writers:

1. **Establish the Tone**
   - What is the Archivist's voice? (ancient, mysterious, precise)
   - How should entity descriptions read? (poetic, technical, ominous)
   - What makes an Atlas entity feel "right"?

2. **Define the Universe Rules**
   - What are the limits of what entities can be?
   - How do different classes relate to each other?
   - What are the established patterns in existing lore?

3. **Guide Interpretation**
   - How should visual media be interpreted?
   - What visual cues map to which entity characteristics?
   - What makes something "Guardian" vs "Wanderer"?

4. **Maintain Consistency**
   - Ensure new entities don't contradict existing lore
   - Define relationship patterns (what entities connect to what)
   - Establish coordinate meanings (what do extreme values mean?)

---

## Best Practices

### Do's ✅
- **Be specific** about output format (especially JSON structure)
- **Include examples** in prompts where helpful
- **Define constraints** explicitly (ranges, enums, required fields)
- **Test thoroughly** with real media/inputs
- **Maintain tone consistency** across all prompts
- **Reference existing lore** when checking consistency

### Don'ts ❌
- Don't make prompts too vague or open-ended
- Don't forget to specify JSON format for structured outputs
- Don't create prompts that conflict with database schema
- Don't ignore validation rules (the app expects specific formats)
- Don't make prompts too long (keep them focused)

---

## Testing Your Prompts

### For Entity Analysis:
1. Upload a test image/video via "+ New Entity"
2. Check the console for Gemini's raw response
3. Verify the JSON structure matches expected schema
4. Check if auto-filled fields make sense
5. Test with different types of imagery

### For Archivist Chat:
1. Start a new entity cataloguing session
2. Upload media and see how Archivist responds
3. Try asking questions about the entity
4. Check if suggestions match the universe tone
5. Test consistency checking with conflicting data

### For Consistency Checks:
1. Try creating an entity with lore conflicts
2. See if the Archivist catches them
3. Test with entities similar to existing ones
4. Verify suggestions for relationships

---

## Current Default Prompts

The system comes with three default prompts (inserted by migration):
1. `archivist_main` - Main Archivist personality
2. `entity_analysis` - Gemini media analysis
3. `consistency_check` - Lore consistency validation

These can be edited or replaced through the Admin Panel.

---

## Technical Notes

- Prompts are stored in `system_prompts` table
- Active prompts have `is_active = true`
- Prompts are referenced by `name` field (must be unique)
- Changes take effect immediately (no server restart needed)
- The `content` field can be very long (TEXT type)

---

## Questions to Guide Prompt Creation

### For the Archivist:
- How does the Archivist greet users?
- How does it respond to questions?
- How does it suggest field values?
- How formal/mystical should the language be?
- Should it reference existing entities by name?

### For Entity Analysis:
- How creative should interpretations be?
- Should it stick closely to visual elements or extrapolate?
- How should ambiguous visuals be handled?
- What default values make sense?
- How to balance creativity with consistency?

### For Consistency:
- How similar is "too similar" for duplicate detection?
- What conflicts are acceptable vs problematic?
- Should it suggest edits or just flag issues?
- How to handle coordinate edge cases?
- What relationships are meaningful to highlight?

---

## Need Help?

- Check the console logs for AI responses
- Review existing entities to understand patterns
- Test with edge cases (very dark images, abstract art, etc.)
- Iterate based on actual output quality
- Reference the Atlas design philosophy documents

