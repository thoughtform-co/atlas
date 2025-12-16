'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import styles from './ForgeVideoCard.module.css';

export interface ForgeGeneration {
  id: string;
  denizen_id: string | null;
  source_image_url: string;
  video_url: string | null;
  thumbnail_url: string | null;
  prompt: string;
  negative_prompt: string | null;
  resolution: string;
  duration: number;
  seed: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  replicate_prediction_id: string | null;
  cost_cents: number | null;
  approved: boolean;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ForgeVideoCardProps {
  generation: ForgeGeneration;
  onApprove?: (id: string, approved: boolean) => void;
  onReuse?: (generation: ForgeGeneration) => void;
}

// Estimated generation times by video duration (in seconds)
const ESTIMATED_TIMES: Record<number, number> = {
  5: 45,
  10: 90,
};

// Thoughtform vocabulary for processing phases
const PHASE_MESSAGES = {
  pending: [
    'Queuing traversal request...',
    'Awaiting manifold access...',
  ],
  initializing: [
    'Opening gateway to latent space...',
    'Calibrating embedding coordinates...',
  ],
  processing: [
    'Navigating latent topology...',
    'Traversing probability manifolds...',
    'Crystallizing temporal patterns...',
    'Mapping feature gradients...',
  ],
  rendering: [
    'Materializing from latent form...',
    'Stabilizing output manifold...',
  ],
};

// Error messages in Thoughtform voice
const ERROR_TITLES = [
  'Traversal collapsed',
  'Manifold breach detected',
  'Dimensional anchor lost',
  'Signal scattered to void',
];

export function ForgeVideoCard({ generation, onApprove, onReuse }: ForgeVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isLoading = generation.status === 'pending' || generation.status === 'processing';
  const isFailed = generation.status === 'failed';
  const isCompleted = generation.status === 'completed';
  
  // Calculate elapsed time since creation
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time
    const createdAt = new Date(generation.created_at).getTime();
    const initialElapsed = Math.floor((Date.now() - createdAt) / 1000);
    setElapsedTime(initialElapsed);

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, generation.created_at]);

  // Rotate messages
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setMessageIndex(prev => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Get estimated duration and calculate progress
  const estimatedDuration = ESTIMATED_TIMES[generation.duration] || 60;
  const progress = Math.min(100, (elapsedTime / estimatedDuration) * 100);
  const remainingTime = Math.max(0, estimatedDuration - elapsedTime);

  // Determine current phase based on progress
  const currentPhase = useMemo(() => {
    if (generation.status === 'pending') return 'pending';
    if (progress < 0.1) return 'initializing';
    if (progress < 0.85) return 'processing';
    return 'rendering';
  }, [generation.status, progress]);

  // Get current message
  const currentMessage = useMemo(() => {
    const messages = PHASE_MESSAGES[currentPhase];
    return messages[messageIndex % messages.length];
  }, [currentPhase, messageIndex]);

  // Get error title (random but stable per generation)
  const errorTitle = useMemo(() => {
    const hash = generation.id.charCodeAt(0) % ERROR_TITLES.length;
    return ERROR_TITLES[hash];
  }, [generation.id]);

  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Copy prompt to clipboard
  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generation.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  }, [generation.prompt]);

  // Download video
  const downloadVideo = useCallback(async () => {
    if (!generation.video_url) return;
    
    try {
      const response = await fetch(generation.video_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forge-${generation.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download video:', error);
    }
  }, [generation.video_url, generation.id]);

  // Handle video hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && generation.status === 'completed') {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className={`${styles.card} ${isLoading ? styles.cardProcessing : ''} ${isFailed ? styles.cardFailed : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Prompt Line (Above Video) */}
      <div 
        className={`${styles.promptLine} ${copied ? styles.promptCopied : ''}`}
        onClick={copyPrompt}
        title="Click to copy prompt"
      >
        <div className={styles.promptText}>
          {generation.prompt}
        </div>
        {copied && <div className={styles.copiedBadge}>COPIED</div>}
      </div>

      {/* Video Frame (16:9) */}
      <div className={styles.videoContainer}>
        {/* Loading State - Show source image with overlay */}
        {isLoading && (
          <>
            {/* Source image as background */}
            <img 
              src={generation.source_image_url} 
              alt="Source" 
              className={styles.sourceImageBackground}
            />
            <div className={styles.processingOverlay}>
              {/* Progress diamond icon */}
              <div className={styles.progressIcon}>
                <div className={styles.progressDiamond}>
                  <span className={styles.progressPercent}>{Math.round(progress)}%</span>
                </div>
              </div>
              
              {/* Time and status */}
              <div className={styles.progressInfo}>
                <span className={styles.timeRemaining}>{formatTime(remainingTime)}</span>
                <span className={styles.phaseMessage}>{currentMessage}</span>
              </div>
              
              {/* Progress bar */}
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </>
        )}

        {/* Failed State */}
        {isFailed && (
          <>
            <img 
              src={generation.source_image_url} 
              alt="Source" 
              className={styles.sourceImageBackground}
            />
            <div className={styles.failedOverlay}>
              <div className={styles.failedIcon}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className={styles.failedTitle}>{errorTitle}</span>
              {generation.error_message && (
                <span className={styles.errorMessage}>{generation.error_message}</span>
              )}
            </div>
          </>
        )}

        {/* Video Player */}
        {isCompleted && generation.video_url && (
          <video
            ref={videoRef}
            src={generation.video_url}
            poster={generation.thumbnail_url || undefined}
            className={styles.video}
            muted
            loop
            playsInline
          />
        )}

        {/* Source Image Fallback */}
        {!generation.video_url && !isLoading && !isFailed && (
          <img 
            src={generation.source_image_url} 
            alt="Source" 
            className={styles.sourceImage}
          />
        )}

        {/* Approved Badge */}
        {generation.approved && (
          <div className={styles.approvedBadge}>
            <span>✓</span>
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && isCompleted && (
          <div className={styles.hoverActions}>
            {/* Download */}
            <button 
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                downloadVideo();
              }}
              title="Download"
            >
              <span className={styles.actionIcon}>↓</span>
            </button>

            {/* Reuse */}
            <button 
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onReuse?.(generation);
              }}
              title="Reuse parameters"
            >
              <span className={styles.actionIcon}>↻</span>
            </button>

            {/* Approve */}
            <button 
              className={`${styles.actionButton} ${generation.approved ? styles.actionActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(generation.id, !generation.approved);
              }}
              title={generation.approved ? 'Remove approval' : 'Approve'}
            >
              <span className={styles.actionIcon}>✓</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
