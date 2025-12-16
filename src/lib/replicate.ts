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
export type VideoModel = 'wan-2.1-i2v' | 'minimax-video' | 'hunyuan-video';

export const VIDEO_MODELS: Record<VideoModel, { name: string; owner: string; model: string }> = {
  'wan-2.1-i2v': {
    name: 'Wan 2.5',
    owner: 'wavespeedai',
    model: 'wan-2.1-i2v-480p',
  },
  'minimax-video': {
    name: 'Minimax',
    owner: 'minimax',
    model: 'video-01',
  },
  'hunyuan-video': {
    name: 'Hunyuan',
    owner: 'tencent',
    model: 'hunyuan-video',
  },
};

// Default model
const DEFAULT_MODEL: VideoModel = 'wan-2.1-i2v';

// Approximate cost per second of video generation (in cents)
// Based on Replicate's GPU pricing for video models
const COST_PER_SECOND_CENTS = 2; // ~$0.02 per second of generation time

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Start a video generation prediction on Replicate
 * Uses the models API endpoint for better reliability
 */
export async function generateVideo(
  params: GenerateVideoParams,
  webhookUrl?: string
): Promise<ReplicatePrediction> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  // Get model config
  const model = params.model || DEFAULT_MODEL;
  const modelConfig = VIDEO_MODELS[model];
  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}`);
  }

  const input: Record<string, unknown> = {
    image: params.image,
    prompt: params.prompt,
  };

  // Add optional parameters based on model
  if (params.negative_prompt) {
    input.negative_prompt = params.negative_prompt;
  }
  
  // Wan model specific parameters
  if (model === 'wan-2.1-i2v') {
    // Wan uses num_frames instead of duration
    // 24 fps, so 5s = 120 frames, 10s = 240 frames
    input.num_frames = params.duration === 10 ? 81 : 41;
    // Resolution mapping for Wan
    if (params.resolution === '1080p') {
      input.resolution = '1280x720'; // Wan max is 720p
    } else if (params.resolution === '720p') {
      input.resolution = '848x480';
    } else {
      input.resolution = '640x352';
    }
  } else {
    // Other models may use duration directly
    if (params.duration) {
      input.duration = params.duration;
    }
    if (params.resolution) {
      input.resolution = params.resolution;
    }
  }
  
  if (params.seed !== undefined) {
    input.seed = params.seed;
  }

  const body: Record<string, unknown> = {
    input,
  };

  // Add webhook if provided
  if (webhookUrl) {
    body.webhook = webhookUrl;
    body.webhook_events_filter = ['completed'];
  }

  // Use the models endpoint for better reliability
  const apiUrl = `https://api.replicate.com/v1/models/${modelConfig.owner}/${modelConfig.model}/predictions`;
  
  console.log('[Replicate] Creating prediction:', {
    model: `${modelConfig.owner}/${modelConfig.model}`,
    webhookUrl,
    inputKeys: Object.keys(input),
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=5', // Wait up to 5s for quick responses
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Replicate] API error:', response.status, errorText);
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  const prediction = await response.json();
  console.log('[Replicate] Prediction created:', {
    id: prediction.id,
    status: prediction.status,
  });

  return prediction;
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
