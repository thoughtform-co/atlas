/**
 * Claude AI Service - Vision analysis and chat completion
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  CLAUDE_MODEL,
  CLAUDE_CONFIG,
  ARCHIVIST_SYSTEM_PROMPT,
  isClaudeConfigured,
} from './config';
import type { VideoAnalysis, ImageAnalysis, Message, AIServiceError } from './types';

/**
 * Initialize Anthropic client (lazy initialization)
 */
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!isClaudeConfigured()) {
    throw new Error(
      'Claude API not configured. Please set ANTHROPIC_API_KEY environment variable.'
    );
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: CLAUDE_CONFIG.apiKey,
    });
  }

  return anthropicClient;
}

/**
 * Analyze a video URL for entity characteristics
 *
 * @param videoUrl - Public URL to the video file
 * @returns Structured analysis of the entity in the video
 * @throws AIServiceError if analysis fails
 */
export async function analyzeVideo(videoUrl: string): Promise<VideoAnalysis> {
  try {
    const client = getAnthropicClient();

    const systemPrompt = `${ARCHIVIST_SYSTEM_PROMPT}

You are analyzing video footage of a denizen. Provide a structured analysis in JSON format with the following structure:

{
  "appearance": {
    "colors": ["array of primary colors observed"],
    "shapes": ["geometric or organic forms"],
    "textures": ["surface qualities"],
    "size": "relative scale description",
    "luminosity": "light emission or absorption qualities"
  },
  "behavior": {
    "movement": "description of how it moves",
    "patterns": ["behavioral patterns observed"],
    "rhythm": "temporal qualities of movement"
  },
  "qualities": {
    "mood": "emotional or atmospheric presence",
    "energy": "energetic signature",
    "stability": "consistency of form/behavior"
  },
  "suggestedFields": {
    "phaseState": "solid/liquid/plasma/transcendent/etc (optional)",
    "hallucinationIndex": 0-100 (optional),
    "manifoldCurvature": -1 to 1 (optional),
    "threatLevel": "Benign/Cautious/Volatile/Existential (optional)",
    "type": "Guardian/Wanderer/Architect/Void-Born/Hybrid (optional)"
  },
  "rawDescription": "A detailed prose description of the entity"
}`;

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this video recording of a denizen. Provide your analysis in the JSON format specified.',
            },
            {
              type: 'text',
              text: `Video URL: ${videoUrl}`,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response (handle potential markdown code blocks)
    const jsonText = textContent.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(jsonText) as VideoAnalysis;

    return analysis;
  } catch (error) {
    console.error('Error analyzing video with Claude:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to analyze video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'claude',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Analyze an image URL for entity characteristics
 *
 * @param imageUrl - Public URL to the image file (or base64 data URI)
 * @returns Structured analysis of the entity in the image
 * @throws AIServiceError if analysis fails
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  try {
    const client = getAnthropicClient();

    const systemPrompt = `${ARCHIVIST_SYSTEM_PROMPT}

You are analyzing an image of a denizen. Provide a structured analysis in JSON format with the following structure:

{
  "appearance": {
    "colors": ["primary colors observed"],
    "shapes": ["forms and silhouettes"],
    "textures": ["surface qualities"],
    "composition": "spatial arrangement",
    "lighting": "illumination qualities"
  },
  "symbolism": {
    "glyphs": ["symbolic markings if visible"],
    "patterns": ["repeated visual motifs"],
    "meanings": ["potential symbolic significance"]
  },
  "qualities": {
    "mood": "emotional or atmospheric presence",
    "energy": "energetic signature",
    "presence": "sense of being or consciousness"
  },
  "suggestedFields": {
    "domain": "suggested domain/realm (optional)",
    "allegiance": "Liminal Covenant/Nomenclate/Unaligned/Unknown (optional)",
    "features": ["notable characteristics (optional)"]
  },
  "rawDescription": "A detailed prose description of what is observed"
}`;

    // Determine if this is a data URI or external URL
    const isDataUri = imageUrl.startsWith('data:');

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image of a denizen. Provide your analysis in the JSON format specified.',
            },
            isDataUri
              ? {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: imageUrl.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: imageUrl.split(',')[1],
                  },
                }
              : {
                  type: 'text',
                  text: `Image URL: ${imageUrl}`,
                },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    const jsonText = textContent.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(jsonText) as ImageAnalysis;

    return analysis;
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'claude',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * General chat completion with Claude
 *
 * @param messages - Array of conversation messages
 * @param systemPrompt - System prompt (defaults to ARCHIVIST_SYSTEM_PROMPT)
 * @returns Assistant's response text
 * @throws AIServiceError if chat completion fails
 */
export async function chat(
  messages: Message[],
  systemPrompt: string = ARCHIVIST_SYSTEM_PROMPT
): Promise<string> {
  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return textContent.text;
  } catch (error) {
    console.error('Error in Claude chat completion:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to complete chat: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'claude',
      originalError: error,
    } as AIServiceError;
  }
}

/**
 * Extract key information from free-form text about a denizen
 * Useful for processing archivist notes into structured data
 *
 * @param text - Free-form text about an entity
 * @returns Structured extraction of key information
 */
export async function extractEntityInfo(text: string): Promise<{
  name?: string;
  type?: string;
  domain?: string;
  features?: string[];
  description: string;
}> {
  try {
    const systemPrompt = `${ARCHIVIST_SYSTEM_PROMPT}

Extract key information from the provided text about a denizen. Return JSON with this structure:
{
  "name": "entity name if mentioned",
  "type": "Guardian/Wanderer/Architect/Void-Born/Hybrid if determinable",
  "domain": "realm or domain if mentioned",
  "features": ["notable characteristics"],
  "description": "clean, concise description"
}`;

    const response = await chat(
      [{ role: 'user', content: text }],
      systemPrompt
    );

    // Parse JSON from response
    const jsonText = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error extracting entity info:', error);
    throw {
      name: 'AIServiceError',
      message: `Failed to extract entity info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      service: 'claude',
      originalError: error,
    } as AIServiceError;
  }
}
