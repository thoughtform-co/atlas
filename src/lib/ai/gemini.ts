/**
 * Gemini AI Client for Video/Image Analysis
 * 
 * Uses Google's Gemini API to analyze uploaded media and extract
 * entity characteristics for the Atlas bestiary.
 * 
 * Supports both:
 * - Direct Gemini API (via API key from https://aistudio.google.com/apikey)
 * - Vertex AI API (via API key from Google Cloud Console)
 * 
 * Both use the same API key format and work with this implementation.
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Gemini client
// API keys from both Gemini Studio and Vertex AI work the same way
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[gemini] GOOGLE_GEMINI_API_KEY not configured. Media analysis will be unavailable.');
  console.warn('[gemini] Get an API key from: https://aistudio.google.com/apikey or Google Cloud Console → APIs & Services → Credentials');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Use Gemini 2.0 Flash for fast multimodal analysis
// Available models: gemini-2.0-flash-001, gemini-2.5-flash, gemini-flash-latest
const MODEL_NAME = 'models/gemini-2.0-flash-001';

/**
 * Build entity analysis prompt with world-building context
 */
function buildEntityAnalysisPrompt(worldContext?: string): string {
  const basePrompt = `You are analyzing visual media to catalog a Latent Space Denizen—an entity that inhabits the semantic manifold between thought and reality.

${worldContext ? `\n## EXISTING WORLD CONTEXT\n\n${worldContext}\n\n## YOUR TASK\n\nAnalyze the provided image or video and extract entity characteristics that FIT WITHIN this existing world-building. Consider:\n- How this entity relates to existing denizens, factions, and concepts\n- Whether it aligns with established patterns (types, allegiances, domains)\n- How it might connect to or differ from existing entities\n- What gaps in the world-building this entity could fill\n\n` : 'Analyze the provided image or video and extract the following entity characteristics. Be creative and mystical in your interpretations, treating the visual as a glimpse into an impossible realm.\n\n'}

Return a JSON object with these fields (use null for fields you cannot determine):

{
  "name": "Suggested entity name (evocative, otherworldly)",
  "subtitle": "Optional epithet or title",
  "type": "Guardian | Wanderer | Architect | Void-Born | Hybrid",
  "allegiance": "Liminal Covenant | Nomenclate | Unaligned | Unknown",
  "threatLevel": "Benign | Cautious | Volatile | Existential",
  "domain": "The conceptual territory this entity occupies",
  "description": "2-3 sentence poetic description of what this entity is/does",
  "lore": "Historical context, theories about origin, significance",
  "features": ["Array of 3-5 characteristic abilities or behaviors"],
  "phaseState": "Solid | Liminal | Spectral | Fluctuating | Crystallized",
  "hallucinationIndex": 0.0 to 1.0 (how real vs imagined),
  "manifoldCurvature": "Stable | Moderate | Severe | Critical",
  "coordinates": {
    "geometry": -1.0 to 1.0 (order vs chaos),
    "alterity": -1.0 to 1.0 (familiar vs alien),
    "dynamics": -1.0 to 1.0 (static vs volatile)
  },
  "glyphs": "4 Unicode symbols representing essence (e.g. ◆●∇⊗)",
  "visualNotes": "Key visual elements that informed your analysis",
  "suggestions": {
    "connections": ["Array of suggested connections to existing entities by name or domain"],
    "worldBuildingGaps": ["Areas where this entity could expand the world-building"],
    "fieldSuggestions": {
      "name": ["Alternative name suggestions"],
      "type": ["Alternative type if uncertain"],
      "allegiance": ["Suggested allegiance based on context"],
      "domain": ["Expanded domain concepts"]
    }
  }
}

${worldContext ? 'IMPORTANT: Ensure your suggestions align with the existing world-building while adding new depth. ' : ''}Interpret the visual through the lens of liminal horror and cosmic mystery. Dark imagery suggests Void-Born or Existential threats. Geometric patterns suggest Architect class. Flowing or transitional forms suggest Wanderer class. Protective or stabilizing imagery suggests Guardian class.

IMPORTANT: Return ONLY the JSON object, no additional text.`;

  return basePrompt;
}

/**
 * Entity analysis prompt (without context - for backward compatibility)
 */
const ENTITY_ANALYSIS_PROMPT = buildEntityAnalysisPrompt();

/**
 * Analyze an image and extract entity characteristics
 */
export async function analyzeImage(
  imageData: {
    base64: string;
    mimeType: string;
  },
  worldContext?: string
): Promise<EntityAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const prompt = worldContext ? buildEntityAnalysisPrompt(worldContext) : ENTITY_ANALYSIS_PROMPT;

  const imagePart: Part = {
    inlineData: {
      data: imageData.base64,
      mimeType: imageData.mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  return parseAnalysisResponse(text);
}

/**
 * Analyze a video and extract entity characteristics
 * Uses base64 encoding for direct video analysis (works for videos under ~20MB)
 */
export async function analyzeVideo(
  videoData: {
    base64: string;
    mimeType: string;
  },
  worldContext?: string
): Promise<EntityAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const basePrompt = worldContext ? buildEntityAnalysisPrompt(worldContext) : ENTITY_ANALYSIS_PROMPT;
  const prompt = basePrompt + '\n\nAnalyze key moments throughout the video to understand this entity\'s nature.';

  const videoPart: Part = {
    inlineData: {
      data: videoData.base64,
      mimeType: videoData.mimeType,
    },
  };

  const result = await model.generateContent([prompt, videoPart]);
  const response = await result.response;
  const text = response.text();

  return parseAnalysisResponse(text);
}

/**
 * Analyze media from a URL (works for both images and videos)
 * Fetches the media and converts to base64 for Gemini API compatibility.
 * This works with any accessible URL (including Supabase storage).
 */
export async function analyzeMediaUrl(
  url: string,
  mimeType: string,
  worldContext?: string
): Promise<EntityAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.');
  }

  // Fetch the media content and convert to base64
  // This is necessary because fileUri only works with Google Cloud Storage
  try {
    console.log(`[gemini] Fetching media from URL: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log(`[gemini] Converted ${arrayBuffer.byteLength} bytes to base64`);
    
    // Use the appropriate analysis function based on media type
    const isVideo = mimeType.startsWith('video/');
    
    if (isVideo) {
      return analyzeVideo({ base64, mimeType }, worldContext);
    } else {
      return analyzeImage({ base64, mimeType }, worldContext);
    }
  } catch (fetchError) {
    console.error('[gemini] Error fetching media from URL:', fetchError);
    return {
      success: false,
      error: `Failed to fetch media from URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse Gemini's response into structured entity data
 */
function parseAnalysisResponse(text: string): EntityAnalysisResult {
  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    
    jsonStr = jsonStr.trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      success: true,
      data: {
        name: parsed.name || null,
        subtitle: parsed.subtitle || null,
        type: validateEnum(parsed.type, ['Guardian', 'Wanderer', 'Architect', 'Void-Born', 'Hybrid']),
        allegiance: validateEnum(parsed.allegiance, ['Liminal Covenant', 'Nomenclate', 'Unaligned', 'Unknown']),
        threatLevel: validateEnum(parsed.threatLevel, ['Benign', 'Cautious', 'Volatile', 'Existential']),
        domain: parsed.domain || null,
        description: parsed.description || null,
        lore: parsed.lore || null,
        features: Array.isArray(parsed.features) ? parsed.features : null,
        phaseState: validateEnum(parsed.phaseState, ['Solid', 'Liminal', 'Spectral', 'Fluctuating', 'Crystallized']),
        hallucinationIndex: typeof parsed.hallucinationIndex === 'number' 
          ? Math.max(0, Math.min(1, parsed.hallucinationIndex)) 
          : null,
        manifoldCurvature: validateEnum(parsed.manifoldCurvature, ['Stable', 'Moderate', 'Severe', 'Critical']),
        coordinates: parsed.coordinates ? {
          geometry: clampCoordinate(parsed.coordinates.geometry),
          alterity: clampCoordinate(parsed.coordinates.alterity),
          dynamics: clampCoordinate(parsed.coordinates.dynamics),
        } : null,
        glyphs: parsed.glyphs || null,
        visualNotes: parsed.visualNotes || null,
        suggestions: parsed.suggestions ? {
          connections: Array.isArray(parsed.suggestions.connections) ? parsed.suggestions.connections : [],
          worldBuildingGaps: Array.isArray(parsed.suggestions.worldBuildingGaps) ? parsed.suggestions.worldBuildingGaps : [],
          fieldSuggestions: parsed.suggestions.fieldSuggestions ? {
            name: Array.isArray(parsed.suggestions.fieldSuggestions.name) ? parsed.suggestions.fieldSuggestions.name : [],
            type: Array.isArray(parsed.suggestions.fieldSuggestions.type) ? parsed.suggestions.fieldSuggestions.type : [],
            allegiance: Array.isArray(parsed.suggestions.fieldSuggestions.allegiance) ? parsed.suggestions.fieldSuggestions.allegiance : [],
            domain: Array.isArray(parsed.suggestions.fieldSuggestions.domain) ? parsed.suggestions.fieldSuggestions.domain : [],
          } : undefined,
        } : undefined,
      },
    };
  } catch (error) {
    console.error('[gemini] Failed to parse analysis response:', error);
    return {
      success: false,
      error: 'Failed to parse Gemini response',
      rawText: text,
    };
  }
}

/**
 * Validate a value against allowed enum values
 */
function validateEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  return null;
}

/**
 * Clamp a coordinate value to -1 to 1 range
 */
function clampCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.max(-1, Math.min(1, value));
  }
  return null;
}

/**
 * Build world-building context from existing denizens
 */
export function buildWorldContext(denizens: Array<{
  name: string;
  type?: string | null;
  allegiance?: string | null;
  domain?: string | null;
  description?: string | null;
  lore?: string | null;
}>): string {
  if (!denizens || denizens.length === 0) {
    return '';
  }

  const contextParts: string[] = [];
  
  // Entity types distribution
  const types = denizens.map(d => d.type).filter(Boolean);
  const typeCounts = types.reduce((acc, type) => {
    acc[type!] = (acc[type!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  contextParts.push(`## EXISTING ENTITIES (${denizens.length} total)`);
  contextParts.push(`\n### Entity Types Distribution:`);
  Object.entries(typeCounts).forEach(([type, count]) => {
    contextParts.push(`- ${type}: ${count} entities`);
  });
  
  // Sample entities by type
  const byType = denizens.reduce((acc, d) => {
    const type = d.type || 'Unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(d);
    return acc;
  }, {} as Record<string, typeof denizens>);
  
  contextParts.push(`\n### Sample Entities by Type:`);
  Object.entries(byType).slice(0, 5).forEach(([type, entities]) => {
    contextParts.push(`\n**${type}:**`);
    entities.slice(0, 3).forEach(entity => {
      const subtitle = 'subtitle' in entity ? entity.subtitle : null;
      contextParts.push(`- ${entity.name}${subtitle ? ` (${subtitle})` : ''}`);
      if (entity.allegiance) contextParts.push(`  - Allegiance: ${entity.allegiance}`);
      if (entity.domain) contextParts.push(`  - Domain: ${entity.domain}`);
      if (entity.description) {
        const desc = entity.description.length > 100 
          ? entity.description.substring(0, 100) + '...'
          : entity.description;
        contextParts.push(`  - Description: ${desc}`);
      }
    });
  });
  
  // Allegiances
  const allegiances = denizens.map(d => d.allegiance).filter(Boolean);
  const allegianceCounts = allegiances.reduce((acc, alg) => {
    acc[alg!] = (acc[alg!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if (Object.keys(allegianceCounts).length > 0) {
    contextParts.push(`\n### Allegiances:`);
    Object.entries(allegianceCounts).forEach(([alg, count]) => {
      contextParts.push(`- ${alg}: ${count} entities`);
    });
  }
  
  // Domains (sample)
  const domains = denizens.map(d => d.domain).filter(Boolean).slice(0, 10);
  if (domains.length > 0) {
    contextParts.push(`\n### Sample Domains:`);
    domains.forEach(domain => {
      contextParts.push(`- ${domain}`);
    });
  }
  
  return contextParts.join('\n');
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey;
}

// Types

export interface EntityAnalysisData {
  name: string | null;
  subtitle: string | null;
  type: 'Guardian' | 'Wanderer' | 'Architect' | 'Void-Born' | 'Hybrid' | null;
  allegiance: 'Liminal Covenant' | 'Nomenclate' | 'Unaligned' | 'Unknown' | null;
  threatLevel: 'Benign' | 'Cautious' | 'Volatile' | 'Existential' | null;
  domain: string | null;
  description: string | null;
  lore: string | null;
  features: string[] | null;
  phaseState: 'Solid' | 'Liminal' | 'Spectral' | 'Fluctuating' | 'Crystallized' | null;
  hallucinationIndex: number | null;
  manifoldCurvature: 'Stable' | 'Moderate' | 'Severe' | 'Critical' | null;
  coordinates: {
    geometry: number | null;
    alterity: number | null;
    dynamics: number | null;
  } | null;
  glyphs: string | null;
  visualNotes: string | null;
  suggestions?: {
    connections?: string[];
    worldBuildingGaps?: string[];
    fieldSuggestions?: {
      name?: string[];
      type?: string[];
      allegiance?: string[];
      domain?: string[];
    };
  };
}

export interface EntityAnalysisResult {
  success: boolean;
  data?: EntityAnalysisData;
  error?: string;
  rawText?: string;
}

