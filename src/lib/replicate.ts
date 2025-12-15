/**
 * Replicate API Integration
 * Handles video generation using Wan 2.5 i2v model
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type VideoResolution = '480p' | '720p' | '1080p';
export type VideoDuration = 5 | 10;

export interface GenerateVideoParams {
  image: string;           // Base64 data URI or public URL
  prompt: string;
  negative_prompt?: string;
  resolution?: VideoResolution;
  duration?: VideoDuration;
  seed?: number;
  enable_prompt_expansion?: boolean;
  model?: VideoModel;      // Model selection
}

export interface ReplicatePrediction {
  id: string;
  version: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: Record<string, unknown>;
  output: string | string[] | null;
  error: string | null;
  logs: string | null;
  metrics?: {
    predict_time?: number;
  };
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  urls: {
    get: string;
    cancel: string;
  };
}

export interface ReplicateWebhookPayload {
  id: string;
  status: ReplicatePrediction['status'];
  output: string | string[] | null;
  error: string | null;
  metrics?: {
    predict_time?: number;
  };
  completed_at: string | null;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

// Available video generation models on Replicate
export type VideoModel = 'wan-2.5-i2v' | 'seedream-4.5' | 'kling-1.0';

export const VIDEO_MODELS: Record<VideoModel, { name: string; version: string }> = {
  'wan-2.5-i2v': {
    name: 'Wan 2.5',
    version: 'wan-video/wan-2.5-i2v',
  },
  'seedream-4.5': {
    name: 'Seedream 4.5',
    version: 'seedream/seedream-4.5',
  },
  'kling-1.0': {
    name: 'Kling 1.0',
    version: 'kling/kling-1.0',
  },
};

// Default model
const DEFAULT_MODEL: VideoModel = 'wan-2.5-i2v';
const WAN_MODEL_VERSION = VIDEO_MODELS[DEFAULT_MODEL].version;

// Approximate cost per second of video generation (in cents)
// Based on Replicate's GPU pricing for video models
const COST_PER_SECOND_CENTS = 2; // ~$0.02 per second of generation time

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Start a video generation prediction on Replicate
 */
export async function generateVideo(
  params: GenerateVideoParams,
  webhookUrl?: string
): Promise<ReplicatePrediction> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  // Get model version
  const model = params.model || DEFAULT_MODEL;
  const modelConfig = VIDEO_MODELS[model];
  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}`);
  }

  const input: Record<string, unknown> = {
    image: params.image,
    prompt: params.prompt,
  };

  // Add optional parameters
  if (params.negative_prompt) {
    input.negative_prompt = params.negative_prompt;
  }
  if (params.resolution) {
    input.resolution = params.resolution;
  }
  if (params.duration) {
    input.duration = params.duration;
  }
  if (params.seed !== undefined) {
    input.seed = params.seed;
  }
  if (params.enable_prompt_expansion !== undefined) {
    input.enable_prompt_expansion = params.enable_prompt_expansion;
  }

  const body: Record<string, unknown> = {
    version: modelConfig.version,
    input,
  };

  // Add webhook if provided
  if (webhookUrl) {
    body.webhook = webhookUrl;
    body.webhook_events_filter = ['completed'];
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get the status of a prediction
 */
export async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Cancel a running prediction
 */
export async function cancelPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Estimate cost in cents based on video duration and generation time
 */
export function estimateCost(durationSeconds: number, predictTimeSeconds?: number): number {
  // If we have actual predict time, use it for more accurate cost
  if (predictTimeSeconds) {
    return Math.ceil(predictTimeSeconds * COST_PER_SECOND_CENTS);
  }
  
  // Otherwise estimate based on video duration
  // Longer videos take more time to generate
  const estimatedPredictTime = durationSeconds * 10; // Rough estimate: 10s generation per 1s video
  return Math.ceil(estimatedPredictTime * COST_PER_SECOND_CENTS);
}

/**
 * Poll for prediction completion (for non-webhook use)
 */
export async function waitForPrediction(
  predictionId: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (prediction: ReplicatePrediction) => void;
  } = {}
): Promise<ReplicatePrediction> {
  const { maxAttempts = 120, intervalMs = 5000, onProgress } = options;
  
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const prediction = await getPrediction(predictionId);
    
    if (onProgress) {
      onProgress(prediction);
    }
    
    if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
      return prediction;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Prediction ${predictionId} did not complete within ${maxAttempts * intervalMs / 1000} seconds`);
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate generation parameters
 */
export function validateGenerateParams(params: GenerateVideoParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!params.image) {
    errors.push('Image is required');
  }
  
  if (!params.prompt || params.prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }
  
  if (params.resolution && !['480p', '720p', '1080p'].includes(params.resolution)) {
    errors.push('Resolution must be 480p, 720p, or 1080p');
  }
  
  if (params.duration && ![5, 10].includes(params.duration)) {
    errors.push('Duration must be 5 or 10 seconds');
  }
  
  if (params.seed !== undefined && (params.seed < 0 || !Number.isInteger(params.seed))) {
    errors.push('Seed must be a positive integer');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
