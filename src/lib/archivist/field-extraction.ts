import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedFields, ValidationResult } from './types';
import type { DenizenType, Allegiance, ThreatLevel } from '@/lib/types';
import { FIELD_EXTRACTION_PROMPT } from './system-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract structured fields from a conversation exchange
 * Uses Claude to parse natural language into structured data
 */
export async function extractFieldsFromResponse(
  userMessage: string,
  archivistResponse: string,
  conversationHistory: string = ''
): Promise<Partial<ExtractedFields>> {
  try {
    const prompt = `${conversationHistory ? `Previous context:\n${conversationHistory}\n\n` : ''}User: ${userMessage}

Archivist: ${archivistResponse}

${FIELD_EXTRACTION_PROMPT}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent extraction
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {};
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Clean up and validate extracted fields
    return cleanExtractedFields(extracted);
  } catch (error) {
    console.error('Error extracting fields:', error);
    return {};
  }
}

/**
 * Clean and validate extracted fields
 * Ensures values match expected types and enums
 */
function cleanExtractedFields(raw: any): Partial<ExtractedFields> {
  const cleaned: Partial<ExtractedFields> = {};

  // String fields
  if (raw.name && typeof raw.name === 'string') cleaned.name = raw.name.trim();
  if (raw.subtitle && typeof raw.subtitle === 'string') cleaned.subtitle = raw.subtitle.trim();
  if (raw.domain && typeof raw.domain === 'string') cleaned.domain = raw.domain.trim();
  if (raw.description && typeof raw.description === 'string')
    cleaned.description = raw.description.trim();
  if (raw.lore && typeof raw.lore === 'string') cleaned.lore = raw.lore.trim();
  if (raw.firstObserved && typeof raw.firstObserved === 'string')
    cleaned.firstObserved = raw.firstObserved.trim();
  if (raw.glyphs && typeof raw.glyphs === 'string') cleaned.glyphs = raw.glyphs.trim();

  // Enum fields with validation
  const validTypes: DenizenType[] = ['Guardian', 'Wanderer', 'Architect', 'Void-Born', 'Hybrid'];
  if (raw.type && validTypes.includes(raw.type)) {
    cleaned.type = raw.type as DenizenType;
  }

  const validAllegiances: Allegiance[] = [
    'Liminal Covenant',
    'Nomenclate',
    'Unaligned',
    'Unknown',
  ];
  if (raw.allegiance && validAllegiances.includes(raw.allegiance)) {
    cleaned.allegiance = raw.allegiance as Allegiance;
  }

  const validThreatLevels: ThreatLevel[] = ['Benign', 'Cautious', 'Volatile', 'Existential'];
  if (raw.threatLevel && validThreatLevels.includes(raw.threatLevel)) {
    cleaned.threatLevel = raw.threatLevel as ThreatLevel;
  }

  // Array fields
  if (Array.isArray(raw.features)) {
    cleaned.features = raw.features.filter((f: any) => typeof f === 'string').map((f: string) => f.trim());
  }
  if (Array.isArray(raw.suggestedConnections)) {
    cleaned.suggestedConnections = raw.suggestedConnections
      .filter((c: any) => typeof c === 'string')
      .map((c: string) => c.trim());
  }

  // Coordinate fields (-1 to 1)
  if (typeof raw.coordGeometry === 'number' && raw.coordGeometry >= -1 && raw.coordGeometry <= 1) {
    cleaned.coordGeometry = raw.coordGeometry;
  }
  if (typeof raw.coordAlterity === 'number' && raw.coordAlterity >= -1 && raw.coordAlterity <= 1) {
    cleaned.coordAlterity = raw.coordAlterity;
  }
  if (typeof raw.coordDynamics === 'number' && raw.coordDynamics >= -1 && raw.coordDynamics <= 1) {
    cleaned.coordDynamics = raw.coordDynamics;
  }

  // Extended classification
  const extended: any = {};
  const validPhaseStates = ['Solid', 'Liminal', 'Spectral', 'Fluctuating', 'Crystallized'];
  if (raw.phaseState && validPhaseStates.includes(raw.phaseState)) {
    extended.phaseState = raw.phaseState;
  }
  if (Array.isArray(raw.superposition)) {
    extended.superposition = raw.superposition
      .filter((s: any) => typeof s === 'string')
      .map((s: string) => s.trim());
  }
  if (
    typeof raw.hallucinationIndex === 'number' &&
    raw.hallucinationIndex >= 0 &&
    raw.hallucinationIndex <= 1
  ) {
    extended.hallucinationIndex = raw.hallucinationIndex;
  }
  if (typeof raw.manifoldCurvature === 'number') {
    extended.manifoldCurvature = raw.manifoldCurvature;
  }

  if (Object.keys(extended).length > 0) {
    cleaned.extended = extended;
  }

  return cleaned;
}

/**
 * Merge new fields with existing session fields
 * New fields override existing ones; arrays are concatenated and deduped
 */
export function mergeFields(
  existing: ExtractedFields,
  newFields: Partial<ExtractedFields>
): ExtractedFields {
  const merged = { ...existing };

  // Simple overwrites for scalar values
  if (newFields.name !== undefined) merged.name = newFields.name;
  if (newFields.subtitle !== undefined) merged.subtitle = newFields.subtitle;
  if (newFields.type !== undefined) merged.type = newFields.type;
  if (newFields.allegiance !== undefined) merged.allegiance = newFields.allegiance;
  if (newFields.threatLevel !== undefined) merged.threatLevel = newFields.threatLevel;
  if (newFields.domain !== undefined) merged.domain = newFields.domain;
  if (newFields.description !== undefined) merged.description = newFields.description;
  if (newFields.lore !== undefined) merged.lore = newFields.lore;
  if (newFields.firstObserved !== undefined) merged.firstObserved = newFields.firstObserved;
  if (newFields.glyphs !== undefined) merged.glyphs = newFields.glyphs;
  if (newFields.coordGeometry !== undefined) merged.coordGeometry = newFields.coordGeometry;
  if (newFields.coordAlterity !== undefined) merged.coordAlterity = newFields.coordAlterity;
  if (newFields.coordDynamics !== undefined) merged.coordDynamics = newFields.coordDynamics;

  // Merge arrays (dedupe)
  if (newFields.features) {
    const combined = [...(merged.features || []), ...newFields.features];
    merged.features = Array.from(new Set(combined));
  }
  if (newFields.suggestedConnections) {
    const combined = [
      ...(merged.suggestedConnections || []),
      ...newFields.suggestedConnections,
    ];
    merged.suggestedConnections = Array.from(new Set(combined));
  }

  // Merge extended classification
  if (newFields.extended) {
    merged.extended = {
      ...merged.extended,
      ...newFields.extended,
    };
  }

  return merged;
}

/**
 * Validate that extracted fields are sufficient to create a denizen
 * Returns validation result with errors, warnings, and confidence score
 */
export function validateFields(fields: ExtractedFields): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  // Required fields
  if (!fields.name) missingRequired.push('name');
  if (!fields.type) missingRequired.push('type');
  if (!fields.allegiance) missingRequired.push('allegiance');
  if (!fields.threatLevel) missingRequired.push('threat level');
  if (!fields.domain) missingRequired.push('domain');
  if (!fields.description) missingRequired.push('description');

  // Highly recommended fields
  if (!fields.lore) warnings.push('No lore provided - entity history will be incomplete');
  if (!fields.features || fields.features.length === 0)
    warnings.push('No features listed - entity abilities unclear');
  if (!fields.glyphs) warnings.push('No glyphs assigned - symbolic representation missing');

  // Coordinate warnings
  if (
    fields.coordGeometry === undefined ||
    fields.coordAlterity === undefined ||
    fields.coordDynamics === undefined
  ) {
    warnings.push('Cardinal coordinates not fully specified - will use defaults');
  }

  // Calculate confidence based on completeness
  let confidence = 0;

  const requiredFields = 6; // name, type, allegiance, threatLevel, domain, description
  const filledRequired =
    requiredFields -
    [
      !fields.name,
      !fields.type,
      !fields.allegiance,
      !fields.threatLevel,
      !fields.domain,
      !fields.description,
    ].filter(Boolean).length;

  const optionalFields = 7; // subtitle, lore, features, firstObserved, glyphs, coords, extended
  const filledOptional = [
    fields.subtitle,
    fields.lore,
    fields.features && fields.features.length > 0,
    fields.firstObserved,
    fields.glyphs,
    fields.coordGeometry !== undefined &&
      fields.coordAlterity !== undefined &&
      fields.coordDynamics !== undefined,
    fields.extended && Object.keys(fields.extended).length > 0,
  ].filter(Boolean).length;

  // Weight required fields more heavily
  confidence = (filledRequired / requiredFields) * 0.7 + (filledOptional / optionalFields) * 0.3;

  const valid = missingRequired.length === 0;

  return {
    valid,
    errors,
    warnings,
    missingRequired,
    confidence,
  };
}

/**
 * Calculate overall confidence score for a session
 * Based on field completeness and validation
 */
export function calculateConfidence(fields: ExtractedFields): number {
  const validation = validateFields(fields);
  return validation.confidence;
}

/**
 * Generate suggested follow-up questions based on missing fields
 */
export function generateSuggestedQuestions(fields: ExtractedFields): string[] {
  const questions: string[] = [];
  const validation = validateFields(fields);

  // Questions for missing required fields
  if (!fields.type) {
    questions.push(
      'What is the fundamental nature of this entity? Does it guard, wander, build, or emerge from the void?'
    );
  }
  if (!fields.allegiance) {
    questions.push(
      'Does this entity preserve the fluidity of meaning, impose order, or serve its own purposes?'
    );
  }
  if (!fields.threatLevel) {
    questions.push('What danger does this entity pose to observers or the manifold itself?');
  }
  if (!fields.domain && !fields.description) {
    questions.push('What region of semantic space does this entity occupy or influence?');
  }

  // Questions for recommended fields
  if (!fields.lore) {
    questions.push('When was this entity first observed? What events mark its emergence?');
  }
  if (!fields.features || fields.features.length < 3) {
    questions.push('What characteristic abilities or behaviors does this entity manifest?');
  }

  // Return max 3 questions
  return questions.slice(0, 3);
}
