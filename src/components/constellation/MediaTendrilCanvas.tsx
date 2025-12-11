'use client';

import { useEffect, useRef } from 'react';
import { DenizenMedia } from '@/lib/types';

interface MediaTendrilCanvasProps {
  allMedia: DenizenMedia[];
  currentIndex: number;
  mainCardRef: React.RefObject<HTMLDivElement | null>;
  floatingCardRefs: (React.RefObject<HTMLDivElement | null> | null)[];
}

interface Particle {
  t: number;
  baseOffset: number;
  phase: number;
  size: number;
}

interface TendrilState {
  mediaId: string;
  particles: Particle[];
  pulsePhase: number;
  pulseSpeed: number;
}

/**
 * MediaTendrilCanvas - Draws tendril-like particle connections between main card and floating cards
 * 
 * Similar to ConnectorCanvas but connects media cards instead of entity cards.
 * Performance: 20-30 particles per connection to limit GPU usage.
 */
export function MediaTendrilCanvas({ 
  allMedia, 
  currentIndex, 
  mainCardRef, 
  floatingCardRefs 
}: MediaTendrilCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tendrilsRef = useRef<TendrilState[]>([]);
  const animationRef = useRef<number | undefined>(undefined);


  // Store allMedia in ref to avoid dependency issues
  const allMediaRef = useRef(allMedia);
  const currentIndexRef = useRef(currentIndex);
  
  useEffect(() => {
    allMediaRef.current = allMedia;
    currentIndexRef.current = currentIndex;
  }, [allMedia, currentIndex]);

  useEffect(() => {
    // Initialize tendrils for each floating card
    // Filter out thumbnails and limit to 4 cards
    const filteredMedia = allMediaRef.current
      .filter(m => m.mediaType !== 'thumbnail')
      .slice(0, 4);

    // Get floating card indices (exclude current)
    const floatingIndices = filteredMedia
      .map((_, idx) => idx)
      .filter(idx => idx !== currentIndexRef.current)
      .slice(0, 3);

    tendrilsRef.current = floatingIndices.map((mediaIdx) => {
      const media = filteredMedia[mediaIdx];
      if (!media) return null;

      const particleCount = 25; // Performance limit: 25 particles per connection
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const t = (i % (particleCount / 2)) / (particleCount / 2);
        particles.push({
          t,
          baseOffset: (Math.random() - 0.5) * 8,
          phase: Math.random() * Math.PI * 2,
          size: 2 + Math.random() * 2,
        });
      }

      return {
        mediaId: media.id,
        particles,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.01,
      };
    }).filter((t): t is TendrilState => t !== null);
  }, [allMedia.length, currentIndex]); // Only depend on length and index, not the array itself

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mainCardRef.current) return;
    
    // Don't start animation if no tendrils
    if (tendrilsRef.current.length === 0) return;
    
    // Don't start if no floating card refs
    if (floatingCardRefs.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener('resize', resize);

    const gridSize = 2; // Grid-snapped pixels for performance

    const getCardCenter = (ref: React.RefObject<HTMLDivElement | null> | null): { x: number; y: number } | null => {
      if (!ref || !ref.current) return null;
      const rect = ref.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const drawTendril = (tendril: TendrilState, floatingCardIdx: number) => {
      const mainCenter = getCardCenter(mainCardRef);
      if (!mainCenter) return;

      // Get floating card ref (mapped by floatingIndices)
      const floatingRef = floatingCardRefs[floatingCardIdx];
      if (!floatingRef) return;

      const floatingCenter = getCardCenter(floatingRef);
      if (!floatingCenter) return;

      const dx = floatingCenter.x - mainCenter.x;
      const dy = floatingCenter.y - mainCenter.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) return;

      const nx = -dy / length;
      const ny = dx / length;

      // Global pulse factor
      const globalPulse = 0.5 + Math.sin(tendril.pulsePhase) * 0.35;

      tendril.particles.forEach((p) => {
        const x = mainCenter.x + dx * p.t + nx * p.baseOffset;
        const y = mainCenter.y + dy * p.t + ny * p.baseOffset;

        // Individual particle pulse
        const particlePulse = Math.sin(tendril.pulsePhase * 2 + p.phase) * 0.3 + 0.7;

        // Fade at endpoints
        const edgeFade = Math.min(p.t, 1 - p.t) * 5;
        const alpha = Math.min(1, edgeFade) * globalPulse * particlePulse * 0.6;

        // Pixelated rendering (grid-snapped)
        const px = Math.floor(x / gridSize) * gridSize;
        const py = Math.floor(y / gridSize) * gridSize;

        ctx.fillStyle = `rgba(236, 227, 214, ${alpha * 0.7})`;
        ctx.fillRect(px, py, gridSize, gridSize);
      });
    };

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update and draw tendrils
      tendrilsRef.current.forEach((tendril, idx) => {
        tendril.pulsePhase += tendril.pulseSpeed;
        drawTendril(tendril, idx);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once when canvas is ready - tendrils are initialized in separate effect

  // Early return if no floating cards to connect
  const filteredMedia = allMedia.filter(m => m.mediaType !== 'thumbnail').slice(0, 4);
  const floatingCount = Math.min(3, Math.max(0, filteredMedia.length - 1));
  if (floatingCount === 0 || tendrilsRef.current.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 45, // Between main card (z-50) and floating cards (z-40)
      }}
    />
  );
}

