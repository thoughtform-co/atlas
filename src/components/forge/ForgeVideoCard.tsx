'use client';

import { useState, useRef, useCallback } from 'react';
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

export function ForgeVideoCard({ generation, onApprove, onReuse }: ForgeVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const isLoading = generation.status === 'pending' || generation.status === 'processing';
  const isFailed = generation.status === 'failed';
  const isCompleted = generation.status === 'completed';

  return (
    <div 
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Prompt Box (Left Side) */}
      <div 
        className={`${styles.promptBox} ${copied ? styles.promptCopied : ''}`}
        onClick={copyPrompt}
        title="Click to copy prompt"
      >
        <div className={styles.promptText}>
          {generation.prompt}
        </div>
        <div className={styles.promptMeta}>
          <span>{generation.resolution}</span>
          <span>•</span>
          <span>{generation.duration}s</span>
          {generation.cost_cents && (
            <>
              <span>•</span>
              <span>${(generation.cost_cents / 100).toFixed(2)}</span>
            </>
          )}
        </div>
        {copied && <div className={styles.copiedBadge}>COPIED</div>}
      </div>

      {/* Video Preview (Right Side) */}
      <div className={styles.videoContainer}>
        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>
              {generation.status === 'pending' ? 'QUEUED' : 'GENERATING'}
            </span>
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className={styles.failedOverlay}>
            <span className={styles.failedIcon}>×</span>
            <span className={styles.failedText}>FAILED</span>
            {generation.error_message && (
              <span className={styles.errorMessage}>{generation.error_message}</span>
            )}
          </div>
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
