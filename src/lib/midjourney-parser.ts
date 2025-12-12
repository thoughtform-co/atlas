/**
 * MidJourney Prompt Parser
 * 
 * Parses full MidJourney prompts to extract:
 * - The main prompt text
 * - --sref code
 * - --profile code
 * - --s (stylization) value
 * - --sw (style weight) value
 */

export interface ParsedMidjourneyPrompt {
  prompt: string;
  sref?: string;
  profile?: string;
  stylization?: number;
  styleWeight?: number;
}

/**
 * Parse a full MidJourney prompt string into its components
 * 
 * Example input:
 * "a holographic pixel-mosaic in the style of George Romero of a horned demon warlock with a black beard holding a staff above its head summoning a wormhole into the latent space holding an ancient scroll in his other hand, surrounded by constellations futuristic interface full of glitch noise and data readouts and demonic incantations, high-detail, sci-fi cyberpunk vibe --sref 1942457994 --profile 2wsi8sg --s 750 --sw 750"
 * 
 * @param fullPrompt The complete MidJourney prompt with parameters
 * @returns Parsed components
 */
export function parseMidjourneyPrompt(fullPrompt: string): ParsedMidjourneyPrompt {
  if (!fullPrompt || !fullPrompt.trim()) {
    return { prompt: '' };
  }

  const result: ParsedMidjourneyPrompt = {
    prompt: '',
  };

  // Split by -- to separate prompt from parameters
  // The prompt is everything before the first --
  const parts = fullPrompt.split('--');
  
  // First part is the prompt (trimmed)
  result.prompt = parts[0]?.trim() || '';

  // Parse parameters from remaining parts
  // Each part after the first should be a parameter like "sref 1942457994" or "s 750"
  for (let i = 1; i < parts.length; i++) {
    const paramPart = parts[i].trim();
    if (!paramPart) continue;

    // Split by whitespace to get parameter name and value
    const paramMatch = paramPart.match(/^(\w+)\s+(.+)$/);
    if (!paramMatch) continue;

    const paramName = paramMatch[1].toLowerCase();
    const paramValue = paramMatch[2].trim();

    switch (paramName) {
      case 'sref':
        result.sref = paramValue;
        break;
      case 'profile':
        result.profile = paramValue;
        break;
      case 's':
        const sValue = parseInt(paramValue, 10);
        if (!isNaN(sValue)) {
          result.stylization = sValue;
        }
        break;
      case 'sw':
        const swValue = parseInt(paramValue, 10);
        if (!isNaN(swValue)) {
          result.styleWeight = swValue;
        }
        break;
    }
  }

  return result;
}

/**
 * Reconstruct a full MidJourney prompt from parsed components
 * 
 * @param parsed The parsed components
 * @returns Full prompt string
 */
export function reconstructMidjourneyPrompt(parsed: ParsedMidjourneyPrompt): string {
  const parts: string[] = [parsed.prompt];

  if (parsed.sref) {
    parts.push(`--sref ${parsed.sref}`);
  }
  if (parsed.profile) {
    parts.push(`--profile ${parsed.profile}`);
  }
  if (parsed.stylization !== undefined) {
    parts.push(`--s ${parsed.stylization}`);
  }
  if (parsed.styleWeight !== undefined) {
    parts.push(`--sw ${parsed.styleWeight}`);
  }

  return parts.join(' ');
}
