# Field Extraction Workflows

The Archivist extracts structured fields from natural language conversations. This document outlines the extraction process, validation, and confidence scoring.

## Extraction Process

### Field Extraction Prompt

When extracting fields from a conversation exchange, use this prompt structure:

```
Analyze the conversation and extract any structured field values that can be determined.

Return ONLY valid field values that are clearly stated or strongly implied. Use "uncertain" for ambiguous cases.

Fields to extract:
- name: string
- subtitle: string
- type: "Guardian" | "Wanderer" | "Architect" | "Void-Born" | "Hybrid"
- allegiance: "Liminal Covenant" | "Nomenclate" | "Unaligned" | "Unknown"
- threatLevel: "Benign" | "Cautious" | "Volatile" | "Existential"
- domain: string
- description: string (concise, poetic summary)
- lore: string (historical context, theories)
- features: string[] (3-5 characteristic abilities/behaviors)
- firstObserved: string
- glyphs: string (4 Unicode symbols)
- phaseState: "Solid" | "Liminal" | "Spectral" | "Fluctuating" | "Crystallized"
- superposition: string[] (multiple simultaneous states)
- hallucinationIndex: number (0-1)
- manifoldCurvature: number
- coordGeometry: number (-1 to 1)
- coordAlterity: number (-1 to 1)
- coordDynamics: number (-1 to 1)
- suggestedConnections: string[] (IDs or names of related entities)

Return as JSON object with only the fields you can confidently extract.
```

### Extraction Workflow

1. **Gather Context**: Include recent conversation history (last 3-4 exchanges)
2. **Call Extraction**: Use Claude with low temperature (0.3) for consistency
3. **Parse Response**: Extract JSON from response (may be wrapped in markdown)
4. **Clean Fields**: Validate types and enums
5. **Merge**: Combine with existing session fields
6. **Validate**: Check completeness and calculate confidence

## Field Categories

### Required Fields
These must be present to create a denizen:
- `name`: Entity name
- `type`: Entity type (Guardian, Wanderer, Architect, Void-Born, Hybrid)
- `allegiance`: Allegiance group
- `threatLevel`: Threat assessment
- `domain`: Domain/territory
- `description`: Poetic description

### Recommended Fields
Highly recommended but not strictly required:
- `lore`: Historical context
- `features`: Characteristic abilities (array)
- `glyphs`: Symbolic representation (4 Unicode symbols)
- `firstObserved`: When first seen
- `subtitle`: Secondary title

### Coordinate Fields
3D semantic coordinates (-1 to 1):
- `coordGeometry`: Geometric position
- `coordAlterity`: Alterity position
- `coordDynamics`: Dynamic position

### Extended Classification
Advanced classification parameters:
- `phaseState`: Physical/metaphysical state
- `superposition`: Multiple simultaneous states (array)
- `hallucinationIndex`: Reality coefficient (0-1)
- `manifoldCurvature`: Narrative space distortion

### Connection Fields
- `suggestedConnections`: Related entity names/IDs (array)

## Field Validation

### Type Validation

**String Fields**: Trim whitespace, ensure non-empty
**Enum Fields**: Must match valid values exactly
**Number Fields**: 
- Coordinates: Must be between -1 and 1
- hallucinationIndex: Must be between 0 and 1
- manifoldCurvature: Any number (no bounds)

**Array Fields**: 
- Filter to valid types
- Deduplicate entries
- Trim string elements

### Enum Values

**Type**: `Guardian`, `Wanderer`, `Architect`, `Void-Born`, `Hybrid`
**Allegiance**: `Liminal Covenant`, `Nomenclate`, `Unaligned`, `Unknown`
**ThreatLevel**: `Benign`, `Cautious`, `Volatile`, `Existential`
**PhaseState**: `Solid`, `Liminal`, `Spectral`, `Fluctuating`, `Crystallized`

## Field Merging

When merging new fields with existing session fields:

### Overwrite Strategy
- Scalar values: New values overwrite existing
- Arrays: Concatenate and deduplicate
- Extended classification: Merge objects

### Merge Example
```typescript
existing = {
  name: "The Heralds",
  type: "Guardian",
  features: ["Cosmic vision", "Threshold guardianship"]
}

new = {
  type: "Guardian", // Same, no change
  features: ["Cosmic vision", "Star navigation"], // Merge arrays
  domain: "Starhaven Reaches" // New field
}

merged = {
  name: "The Heralds",
  type: "Guardian",
  features: ["Cosmic vision", "Threshold guardianship", "Star navigation"], // Deduplicated
  domain: "Starhaven Reaches"
}
```

## Confidence Scoring

Confidence is calculated based on field completeness:

### Formula
```
confidence = (filledRequired / requiredFields) * 0.7 + (filledOptional / optionalFields) * 0.3
```

### Field Weights
- **Required fields** (6): 70% weight
- **Optional fields** (7): 30% weight

### Confidence Levels
- **0.9+**: Excellent - All required + most optional
- **0.7-0.9**: Good - All required + some optional
- **0.5-0.7**: Fair - Most required, missing some
- **<0.5**: Poor - Missing required fields

### Validation Result
```typescript
{
  valid: boolean,           // All required fields present
  errors: string[],         // Missing required fields
  warnings: string[],       // Missing recommended fields
  missingRequired: string[], // List of missing required field names
  confidence: number        // 0-1 confidence score
}
```

## Suggested Questions

Generate follow-up questions based on missing fields:

### Missing Required Fields
- **type**: "What is the fundamental nature of this entity? Does it guard, wander, build, or emerge from the void?"
- **allegiance**: "Does this entity preserve the fluidity of meaning, impose order, or serve its own purposes?"
- **threatLevel**: "What danger does this entity pose to observers or the manifold itself?"
- **domain**: "What region of semantic space does this entity occupy or influence?"

### Missing Recommended Fields
- **lore**: "When was this entity first observed? What events mark its emergence?"
- **features**: "What characteristic abilities or behaviors does this entity manifest?"

### Question Generation Rules
- Maximum 3 questions per session
- Prioritize required fields
- Ask one question per missing category
- Make questions conversational, not interrogative

## Session Completion

A session is considered complete when:
- All required fields are present (`valid: true`)
- Confidence score > 0.7
- Navigator indicates readiness to commit

## Error Handling

### Extraction Failures
- If JSON parsing fails: Return empty object, log error
- If no fields extracted: Continue conversation, don't block
- If invalid enum values: Filter out invalid, keep valid

### Validation Failures
- Missing required fields: Generate suggested questions
- Low confidence: Continue conversation to gather more info
- Invalid coordinates: Use defaults (0, 0, 0)

## Integration with Tools

Tool results inform field extraction:
- `analyze_image` → `suggested_name`, `suggested_type`, `domain`, `phase_state`
- `find_similar` → `suggestedConnections`, domain validation
- `generate_description` → `description` field

Always merge tool insights with conversation-derived fields.

