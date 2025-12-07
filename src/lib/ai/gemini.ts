/**
 * Gemini AI Client for Video/Image Analysis
 * 
 * Uses Google's Gemini API to analyze uploaded media and extract
 * entity characteristics for the Atlas bestiary.
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Gemini client
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[gemini] GOOGLE_GEMINI_API_KEY not configured. Media analysis will be unavailable.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Use Gemini 1.5 Flash for fast multimodal analysis
const MODEL_NAME = 'gemini-1.5-flash';

/**
 * Entity analysis prompt that guides Gemini to extract structured data
 * from visual media in the Atlas bestiary style.
 */
const ENTITY_ANALYSIS_PROMPT = `You are analyzing visual media to catalog a Latent Space Denizen—an entity that inhabits the semantic manifold between thought and reality.

Analyze the provided image or video and extract the following entity characteristics. Be creative and mystical in your interpretations, treating the visual as a glimpse into an impossible realm.

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
  "visualNotes": "Key visual elements that informed your analysis"
}

Interpret the visual through the lens of liminal horror and cosmic mystery. Dark imagery suggests Void-Born or Existential threats. Geometric patterns suggest Architect class. Flowing or transitional forms suggest Wanderer class. Protective or stabilizing imagery suggests Guardian class.

IMPORTANT: Return ONLY the JSON object, no additional text.`;

/**
 * Analyze an image and extract entity characteristics
 */
export async function analyzeImage(imageData: {
  base64: string;
  mimeType: string;
}): Promise<EntityAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const imagePart: Part = {
    inlineData: {
      data: imageData.base64,
      mimeType: imageData.mimeType,
    },
  };

  const result = await model.generateContent([ENTITY_ANALYSIS_PROMPT, imagePart]);
  const response = await result.response;
  const text = response.text();

  return parseAnalysisResponse(text);
}

/**
 * Analyze a video and extract entity characteristics
 * Note: For videos, we analyze key frames
 */
export async function analyzeVideo(videoUrl: string): Promise<EntityAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // For video analysis, we use the file URI approach
  const videoPart: Part = {
    fileData: {
      fileUri: videoUrl,
      mimeType: 'video/mp4',
    },
  };

  const result = await model.generateContent([
    ENTITY_ANALYSIS_PROMPT + '\n\nAnalyze key moments throughout the video to understand this entity\'s nature.',
    videoPart,
  ]);
  const response = await result.response;
  const text = response.text();

  return parseAnalysisResponse(text);
}

/**
 * Analyze media from a URL (works for both images and videos)
 */
export async function analyzeMediaUrl(
  url: string,
  mimeType: string
): Promise<EntityAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GOOGLE_GEMINI_API_KEY environment variable.');
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const mediaPart: Part = {
    fileData: {
      fileUri: url,
      mimeType,
    },
  };

  const isVideo = mimeType.startsWith('video/');
  const prompt = isVideo
    ? ENTITY_ANALYSIS_PROMPT + '\n\nAnalyze key moments throughout the video to understand this entity\'s nature.'
    : ENTITY_ANALYSIS_PROMPT;

  const result = await model.generateContent([prompt, mediaPart]);
  const response = await result.response;
  const text = response.text();

  return parseAnalysisResponse(text);
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
}

export interface EntityAnalysisResult {
  success: boolean;
  data?: EntityAnalysisData;
  error?: string;
  rawText?: string;
}

