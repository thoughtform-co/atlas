'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './ForgeLoadingOverlay.module.css';

interface ForgeLoadingOverlayProps {
  isVisible: boolean;
  estimatedDuration?: number; // in seconds
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Thoughtform Atlas vocabulary for the loading experience
const PHASE_MESSAGES = {
  initializing: [
    'Initializing manifold traversal...',
    'Calibrating embedding coordinates...',
    'Opening gateway to latent space...',
    'Establishing dimensional anchor...',
  ],
  processing: [
    'Navigating latent topology...',
    'Traversing probability manifolds...',
    'Interpolating across vector fields...',
    'Sampling from the void...',
    'Crystallizing temporal patterns...',
    'Weaving through hidden dimensions...',
    'Mapping feature gradients...',
    'Decoding neural projections...',
  ],
  rendering: [
    'Materializing from latent form...',
    'Collapsing superposition states...',
    'Rendering emergent patterns...',
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

const ERROR_DESCRIPTIONS = [
  'The path through latent space encountered a singularity.',
  'Coordinates destabilized during navigation.',
  'The manifold rejected this particular trajectory.',
  'Insufficient signal strength to maintain projection.',
];

// Technical status messages
const STATUS_LABELS = {
  pending: 'Queuing request',
  processing: 'Processing',
  rendering: 'Rendering',
};

export function ForgeLoadingOverlay({
  isVisible,
  estimatedDuration = 60,
  status = 'processing',
  errorMessage,
  onCancel,
  onRetry,
  onDismiss,
}: ForgeLoadingOverlayProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'initializing' | 'processing' | 'rendering'>('initializing');
  const [messageIndex, setMessageIndex] = useState(0);
  const [particlePositions, setParticlePositions] = useState<{ x: number; y: number; delay: number }[]>([]);
  const [errorIndex] = useState(() => Math.floor(Math.random() * ERROR_TITLES.length));
  
  const isError = status === 'failed';

  // Generate particle positions on mount
  useEffect(() => {
    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticlePositions(particles);
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      setCurrentPhase('initializing');
      setMessageIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Update phase based on progress
  useEffect(() => {
    const progress = elapsedTime / estimatedDuration;
    
    if (progress < 0.1) {
      setCurrentPhase('initializing');
    } else if (progress < 0.85) {
      setCurrentPhase('processing');
    } else {
      setCurrentPhase('rendering');
    }
  }, [elapsedTime, estimatedDuration]);

  // Rotate messages
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const messages = PHASE_MESSAGES[currentPhase];
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible, currentPhase]);

  // Calculate remaining time
  const remainingTime = useMemo(() => {
    const remaining = Math.max(0, estimatedDuration - elapsedTime);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [elapsedTime, estimatedDuration]);

  // Progress percentage
  const progress = Math.min(100, (elapsedTime / estimatedDuration) * 100);

  // Current message
  const currentMessage = PHASE_MESSAGES[currentPhase][messageIndex % PHASE_MESSAGES[currentPhase].length];

  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${isError ? styles.overlayError : ''}`}>
      {/* Particle background */}
      <div className={`${styles.particleField} ${isError ? styles.particleFieldError : ''}`}>
        {particlePositions.map((particle, i) => (
          <div
            key={i}
            className={`${styles.particle} ${isError ? styles.particleError : ''}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Central visualization */}
      <div className={styles.centerContent}>
        {isError ? (
          <>
            {/* Error Icon - fractured manifold */}
            <div className={styles.errorIcon}>
              <div className={styles.errorOuter}>
                <div className={styles.errorInner}>
                  <div className={styles.errorCore}>
                    <svg viewBox="0 0 24 24" className={styles.errorX}>
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Scattered fragments */}
              <div className={styles.fragment} style={{ '--angle': '30deg', '--distance': '50px' } as React.CSSProperties} />
              <div className={styles.fragment} style={{ '--angle': '120deg', '--distance': '45px' } as React.CSSProperties} />
              <div className={styles.fragment} style={{ '--angle': '200deg', '--distance': '55px' } as React.CSSProperties} />
              <div className={styles.fragment} style={{ '--angle': '280deg', '--distance': '48px' } as React.CSSProperties} />
            </div>

            {/* Error text */}
            <div className={styles.errorBlock}>
              <h2 className={styles.errorTitle}>{ERROR_TITLES[errorIndex]}</h2>
              <p className={styles.errorDescription}>{ERROR_DESCRIPTIONS[errorIndex]}</p>
              {errorMessage && (
                <p className={styles.errorDetail}>{errorMessage}</p>
              )}
            </div>

            {/* Error actions */}
            <div className={styles.errorActions}>
              {onRetry && (
                <button className={styles.retryButton} onClick={onRetry}>
                  ATTEMPT RE-ENTRY
                </button>
              )}
              {onDismiss && (
                <button className={styles.dismissButton} onClick={onDismiss}>
                  ACKNOWLEDGE
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Manifold icon - diamond shape with inner elements */}
            <div className={styles.manifoldIcon}>
              <div className={styles.manifoldOuter}>
                <div className={styles.manifoldInner}>
                  <div className={styles.manifoldCore}>
                    <span className={styles.progressValue}>{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
              {/* Orbital particles */}
              <div className={styles.orbital} style={{ animationDelay: '0s' }} />
              <div className={styles.orbital} style={{ animationDelay: '0.5s' }} />
              <div className={styles.orbital} style={{ animationDelay: '1s' }} />
            </div>

            {/* Status text */}
            <div className={styles.statusBlock}>
              <div className={styles.timeRemaining}>
                <span className={styles.timeValue}>{remainingTime}</span>
                <span className={styles.timeLabel}>remaining</span>
              </div>
              
              <div className={styles.phaseMessage}>
                {currentMessage}
              </div>

              <div className={styles.technicalStatus}>
                <span className={styles.statusDot} />
                <span>{STATUS_LABELS[status === 'pending' ? 'pending' : currentPhase === 'rendering' ? 'rendering' : 'processing']}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
              <div className={styles.progressGlow} style={{ left: `${progress}%` }} />
            </div>

            {/* Cancel button */}
            {onCancel && (
              <button className={styles.cancelButton} onClick={onCancel}>
                ABORT TRAVERSAL
              </button>
            )}
          </>
        )}
      </div>

      {/* Grid overlay */}
      <div className={`${styles.gridOverlay} ${isError ? styles.gridOverlayError : ''}`} />
    </div>
  );
}
