/**
 * Archivist Tools System
 * 
 * Provides Claude function calling tools for the Archivist:
 * - find_similar: Search for semantically similar entities
 * - analyze_image: Analyze uploaded images via Gemini
 * - generate_description: Create mythopoetic descriptions
 * - find_by_sref: Find entities by Midjourney style reference (stub)
 */

import type { Tool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { searchByText } from '@/lib/ai/vector-search';
import { analyzeMediaUrl, isGeminiConfigured } from '@/lib/ai/gemini';
import { chat as claudeChat } from '@/lib/ai/claude';
import type { SimilarEntity } from '@/lib/ai/types';

// ============================================================================
// Tool Schemas (Claude Function Calling Format)
// ============================================================================

export const ARCHIVIST_TOOLS: Tool[] = [
  {
    name: 'find_similar',
    description: 'Search for semantically similar entities in the Atlas database using embedding similarity. Use this to find connections, classify new entities, or explore what exists nearby in semantic space.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for - can be an entity name, description, or concept',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'analyze_image',
    description: 'Analyze an uploaded image using Gemini Vision to extract visual characteristics, mood, colors, and suggested entity properties. Use when an image URL is available.',
    input_schema: {
      type: 'object' as const,
      properties: {
        image_url: {
          type: 'string',
          description: 'URL of the image to analyze',
        },
      },
      required: ['image_url'],
    },
  },
  {
    name: 'generate_description',
    description: 'Generate a mythopoetic 2-3 sentence description for an entity based on its characteristics. Use to articulate an entity\'s essence in the Atlas style.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Entity name',
        },
        domain: {
          type: 'string',
          description: 'Domain/territory the entity occupies (e.g., "Starhaven Reaches", "The Lattice")',
        },
        class_name: {
          type: 'string',
          description: 'Class archetype if known (e.g., "Voidwalker", "Eigensage")',
        },
        visual_notes: {
          type: 'string',
          description: 'Visual characteristics from image analysis',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'find_by_sref',
    description: 'Find entities that share a Midjourney style reference code. Entities with the same sref are visually related.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sref_code: {
          type: 'string',
          description: 'The Midjourney sref code to search for',
        },
      },
      required: ['sref_code'],
    },
  },
];

// ============================================================================
// Tool Result Types
// ============================================================================

export interface ToolInvocation {
  name: string;
  input: Record<string, unknown>;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
}

export interface ToolExecutionResult {
  toolUseId: string;
  result: ToolResultBlockParam;
  invocation: ToolInvocation;
}

// ============================================================================
// Configuration
// ============================================================================

const TOOL_CONFIG = {
  maxToolCalls: 3, // Cap recursive tool calls
  timeoutMs: 30000, // 30 second timeout per tool
  maxSimilarResults: 10,
  defaultSimilarResults: 5,
};

// ============================================================================
// Logging
// ============================================================================

const toolInvocations: ToolInvocation[] = [];

function logToolInvocation(invocation: ToolInvocation): void {
  toolInvocations.push(invocation);
  const duration = invocation.endTime 
    ? `${invocation.endTime - invocation.startTime}ms` 
    : 'pending';
  const status = invocation.success ? '✓' : '✗';
  console.log(`[Archivist Tool] ${status} ${invocation.name} (${duration})${invocation.error ? ` - ${invocation.error}` : ''}`);
}

export function getRecentToolInvocations(count: number = 10): ToolInvocation[] {
  return toolInvocations.slice(-count);
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Execute a tool with timeout and error handling
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  toolName: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Tool ${toolName} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * find_similar: Search for semantically similar entities
 */
async function handleFindSimilar(input: { query: string; limit?: number }): Promise<string> {
  const { query, limit = TOOL_CONFIG.defaultSimilarResults } = input;
  const cappedLimit = Math.min(limit, TOOL_CONFIG.maxSimilarResults);
  
  const results = await searchByText(query, cappedLimit);
  
  if (results.length === 0) {
    return JSON.stringify({
      found: 0,
      message: 'No similar entities found in the archive.',
      entities: [],
    });
  }
  
  // Format results for the Archivist
  const formatted = results.map((r: SimilarEntity) => ({
    name: r.denizen.name,
    type: r.denizen.type,
    domain: r.denizen.domain,
    description: r.denizen.description?.substring(0, 200) + (r.denizen.description && r.denizen.description.length > 200 ? '...' : ''),
    similarity: Math.round(r.similarity * 100) / 100,
  }));
  
  return JSON.stringify({
    found: results.length,
    entities: formatted,
  });
}

/**
 * analyze_image: Analyze image via Gemini Vision
 */
async function handleAnalyzeImage(input: { image_url: string }): Promise<string> {
  if (!isGeminiConfigured()) {
    return JSON.stringify({
      success: false,
      error: 'Image analysis is currently unavailable. Please describe the entity visually.',
    });
  }
  
  const { image_url } = input;
  
  // Determine mime type from URL
  const mimeType = image_url.match(/\.(png|jpg|jpeg|gif|webp)/i)
    ? `image/${image_url.match(/\.(png|jpg|jpeg|gif|webp)/i)![1].toLowerCase().replace('jpg', 'jpeg')}`
    : 'image/jpeg';
  
  const result = await analyzeMediaUrl(image_url, mimeType);
  
  if (!result.success || !result.data) {
    return JSON.stringify({
      success: false,
      error: result.error || 'Failed to analyze image',
    });
  }
  
  return JSON.stringify({
    success: true,
    analysis: {
      suggested_name: result.data.name,
      suggested_type: result.data.type,
      domain: result.data.domain,
      description: result.data.description,
      phase_state: result.data.phaseState,
      visual_notes: result.data.visualNotes,
      colors: result.data.coordinates ? {
        gradient: result.data.coordinates.geometry > 0 ? 'warm-gold' : 'cool-white',
      } : null,
      mood: result.data.lore?.substring(0, 100),
    },
  });
}

/**
 * generate_description: Create mythopoetic description
 */
async function handleGenerateDescription(input: {
  name: string;
  domain?: string;
  class_name?: string;
  visual_notes?: string;
}): Promise<string> {
  const { name, domain, class_name, visual_notes } = input;
  
  const prompt = `Generate a mythopoetic description for an Atlas entity.

Entity: ${name}
Domain: ${domain || 'Unknown'}
Class: ${class_name || 'Unclassified'}
Visual Notes: ${visual_notes || 'None provided'}

Guidelines:
- 2-3 sentences maximum
- Present tense, third person
- Evocative but precise
- Reference the entity's apparent nature or role
- Let mystery remain—don't over-explain
- Match the tone to the domain:
  - Starhaven: mythic, purposeful, heroic undertones
  - Lattice: abstract, signal-like, self-referential
  - Threshold: liminal, urgent, transformative
  - Unknown: observational, curious

Good examples:
- "The Nullbringer walks between definitions, carrying absence like a lantern. Where it passes, categories dissolve."
- "Eigensages do not remember—they contain. Each thought is a room; each room holds another thinker."
- "In the static between signals, the Thread-Weaver's arms move through possibilities not yet collapsed."

Avoid:
- "An ancient and powerful entity..."
- "This terrifying creature lurks..."
- Generic fantasy descriptors
- Over-explanation

Write ONLY the description, nothing else:`;

  const description = await claudeChat([{ role: 'user', content: prompt }]);
  
  return JSON.stringify({
    success: true,
    description: description.trim(),
  });
}

/**
 * find_by_sref: Find entities by Midjourney style reference (stub)
 */
async function handleFindBySref(input: { sref_code: string }): Promise<string> {
  // Stub implementation - sref tracking not yet implemented
  return JSON.stringify({
    success: false,
    message: `Style reference lookup for sref:${input.sref_code} is not yet implemented. This feature will be available in a future update.`,
    entities: [],
  });
}

// ============================================================================
// Tool Dispatcher
// ============================================================================

export type ToolInput = {
  find_similar: { query: string; limit?: number };
  analyze_image: { image_url: string };
  generate_description: { name: string; domain?: string; class_name?: string; visual_notes?: string };
  find_by_sref: { sref_code: string };
};

const toolHandlers: Record<string, (input: Record<string, unknown>) => Promise<string>> = {
  find_similar: (input) => handleFindSimilar(input as ToolInput['find_similar']),
  analyze_image: (input) => handleAnalyzeImage(input as ToolInput['analyze_image']),
  generate_description: (input) => handleGenerateDescription(input as ToolInput['generate_description']),
  find_by_sref: (input) => handleFindBySref(input as ToolInput['find_by_sref']),
};

/**
 * Execute a single tool call
 */
export async function executeToolCall(
  toolUseId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const invocation: ToolInvocation = {
    name: toolName,
    input: toolInput,
    startTime: Date.now(),
    success: false,
  };
  
  try {
    const handler = toolHandlers[toolName];
    
    if (!handler) {
      invocation.error = `Unknown tool: ${toolName}`;
      invocation.endTime = Date.now();
      logToolInvocation(invocation);
      
      return {
        toolUseId,
        result: {
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: JSON.stringify({ error: `Unknown tool: ${toolName}` }),
          is_error: true,
        },
        invocation,
      };
    }
    
    const resultContent = await withTimeout(
      handler(toolInput),
      TOOL_CONFIG.timeoutMs,
      toolName
    );
    
    invocation.success = true;
    invocation.endTime = Date.now();
    logToolInvocation(invocation);
    
    return {
      toolUseId,
      result: {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: resultContent,
      },
      invocation,
    };
  } catch (error) {
    invocation.error = error instanceof Error ? error.message : 'Unknown error';
    invocation.endTime = Date.now();
    logToolInvocation(invocation);
    
    // Return user-friendly error message
    const userFriendlyError = getUserFriendlyError(toolName, error);
    
    return {
      toolUseId,
      result: {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: JSON.stringify({ error: userFriendlyError }),
        is_error: true,
      },
      invocation,
    };
  }
}

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyError(toolName: string, error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  if (message.includes('timeout')) {
    return `The ${toolName} search is taking too long. Please try a simpler query.`;
  }
  
  if (message.includes('not configured') || message.includes('API')) {
    switch (toolName) {
      case 'analyze_image':
        return 'Image analysis is currently unavailable. Please describe the entity visually instead.';
      case 'find_similar':
        return 'Semantic search is currently unavailable. I will rely on our conversation to understand this entity.';
      default:
        return `The ${toolName} feature is temporarily unavailable.`;
    }
  }
  
  return `Unable to complete ${toolName} at this time. Let's continue with what we know.`;
}

/**
 * Get tool configuration for external use
 */
export function getToolConfig() {
  return { ...TOOL_CONFIG };
}

