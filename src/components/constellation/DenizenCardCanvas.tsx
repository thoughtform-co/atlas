'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Denizen } from '@/lib/types';
import { getMediaPublicUrl } from '@/lib/media';

// Design system colors
const GOLD = { r: 202, g: 165, b: 84 };
const DYNAMICS = { r: 91, g: 138, b: 122 };
const VOLATILE = { r: 193, g: 127, b: 89 };
const DAWN = { r: 236, g: 227, b: 214 };
const GRID = 3;

// Card dimensions (4:5 aspect ratio)
const CARD_WIDTH = 720;
const CARD_HEIGHT = 900;

interface DenizenCardCanvasProps {
  denizen: Denizen;
  mediaUrl?: string;
  thumbnailUrl?: string;
  isVideo?: boolean;
  elapsedTime?: number;
}

/**
 * Calculates source crop dimensions to replicate CSS object-fit: cover behavior.
 * 
 * WHY: Canvas drawImage doesn't support object-fit CSS property. We must manually
 * calculate which portion of the source media to crop and how to scale it to fill
 * the container while maintaining aspect ratio, matching what users see in the DOM.
 */
function getCoverDimensions(
  contentWidth: number,
  contentHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  const contentRatio = contentWidth / contentHeight;
  const containerRatio = containerWidth / containerHeight;

  let sx = 0, sy = 0, sWidth = contentWidth, sHeight = contentHeight;

  if (containerRatio > contentRatio) {
    // Container is wider - crop height to maintain aspect ratio
    sHeight = contentWidth / containerRatio;
    sy = (contentHeight - sHeight) / 2;
  } else {
    // Container is taller - crop width to maintain aspect ratio
    sWidth = contentHeight * containerRatio;
    sx = (contentWidth - sWidth) / 2;
  }

  return { sx, sy, sWidth, sHeight };
}

// Helper function to format time
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

// Canvas helper functions
function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: { r: number; g: number; b: number }, alpha: number, size = GRID) {
  const px = Math.floor(x / size) * size;
  const py = Math.floor(y / size) * size;
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  ctx.fillRect(px, py, size - 1, size - 1);
}

function drawParticleLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: { r: number; g: number; b: number }, alpha: number, density = 0.3) {
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const steps = Math.max(1, Math.floor(dist * density));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    drawPixel(ctx, x, y, color, alpha * (0.5 + Math.random() * 0.5));
  }
}

function drawParticleCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: { r: number; g: number; b: number }, alpha: number, density = 0.15) {
  const circumference = 2 * Math.PI * radius;
  const particles = Math.max(8, Math.floor(circumference * density));
  for (let i = 0; i < particles; i++) {
    const angle = (i / particles) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    drawPixel(ctx, x, y, color, alpha * (0.6 + Math.random() * 0.4));
  }
}

export interface DenizenCardCanvasHandle {
  exportPNG: () => void;
  exportVideo: () => Promise<void>;
}

export const DenizenCardCanvas = forwardRef<DenizenCardCanvasHandle, DenizenCardCanvasProps>(
  ({ denizen, mediaUrl, thumbnailUrl, isVideo = false, elapsedTime = 0 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const mediaLoadedRef = useRef(false);
    
    // Track elapsedTime in ref to avoid restarting render loop every second
    const elapsedTimeRef = useRef(elapsedTime);
    
    // Update elapsedTime ref without restarting render loop
    useEffect(() => {
      elapsedTimeRef.current = elapsedTime;
    }, [elapsedTime]);
    
    /**
     * Visualization state stored in refs to persist across renders without triggering re-renders.
     * 
     * WHY refs instead of state: Particle positions, animation time, and visualization data
     * change every frame (60fps). Using state would trigger 60 re-renders per second, causing
     * performance issues. Refs allow us to mutate data without React re-renders.
     * 
     * WHY initialize in render loop: Particles are initialized lazily on first render to
     * ensure canvas dimensions are set. This prevents particles from being positioned
     * before canvas is ready.
     */
    const phaseStateRef = useRef({ time: 0, particles: [] as { t: number; life: number; decay: number }[] });
    const hallucStateRef = useRef({ time: 0, ghosts: [] as { angle: number; drift: number; dist: number; flicker: number }[] });
    const coordsStateRef = useRef({ particles: [] as { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] });
    const manifoldStateRef = useRef({ time: 0, particles: [] as { baseX: number; baseY: number }[] });
    const spectralStateRef = useRef({ time: 0, signature: [] as { base: number; variance: number }[] });
    const superStateRef = useRef({ time: 0 });
    
    // Offscreen canvas for static text layer - rendered once, composited every frame
    const staticTextCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const staticTextBuiltRef = useRef(false);
    
    // Comprehensive text layout cache - all positions calculated once, reused every frame
    const textLayoutRef = useRef<{
      header: {
        atlasResearchX: number;
        modeLabelX: number;
        modeValueX: number;
        sigLabelX: number;
        sigValueX: number;
        epochX: number; // Fixed anchor for epoch (right-aligned)
        timeX: number; // Fixed anchor for time (right-aligned)
        timeMaxWidth: number; // Max width for time string (e.g., '[00:00:00]')
      };
      params: {
        leftColX: number;
        rightColX: number;
        // Left column labels
        phaseStateLabelY: number;
        superpositionLabelY: number;
        hallucinationLabelY: number;
        tempValueY: number;
        highValueY: number;
        // Right column labels (explicit, no assumptions about symmetry)
        latentPositionLabelY: number;
        manifoldLabelY: number;
        embeddingLabelY: number;
        coordsValueY: number;
        zValueY: number;
        manifoldValueY: number;
      };
      footer: {
        nameX: number;
        classLabelX: number;
        classValueX: number;
        threatLabelX: number;
        threatValueX: number;
        coordX: number;
        descX: number;
        descMaxWidth: number;
      };
      visualizations: {
        sectionHeight: number; // Cached: 758 / 3
        leftVizX: number;
        leftVizWidth: number;
        rightVizX: number;
        rightVizWidth: number;
        phaseY: number;
        phaseHeight: number;
        phaseCx: number;
        phaseCy: number;
        superY: number;
        superHeight: number;
        superCx: number;
        superCy: number;
        superWidth: number;
        hallucY: number;
        hallucHeight: number;
        hallucCx: number;
        hallucCy: number;
        coordsY: number;
        coordsHeight: number;
        coordsCx: number;
        coordsCy: number;
        manifoldY: number;
        manifoldHeight: number;
        manifoldCx: number;
        manifoldCy: number;
        spectralY: number; // Embedding signature Y position - this was jumping!
        spectralHeight: number;
        spectralCx: number;
        spectralWidth: number;
        spectralBaseY: number; // Bottom baseline for bars - anchored to bottom of panel for UI consistency
      };
    } | null>(null);

    /**
     * Expose export methods via ref so parent component can trigger exports.
     * 
     * WHY useImperativeHandle: Parent (DenizenModalV3) needs to call export methods
     * when user clicks download buttons. Refs allow imperative API while keeping
     * component encapsulated.
     */
    useImperativeHandle(ref, () => ({
      /**
       * Export current canvas state as PNG image.
       * 
       * WHY toBlob instead of toDataURL: toBlob is more memory-efficient for large images
       * and doesn't create a large base64 string. Better for performance.
       */
      exportPNG: () => {
        const canvas = canvasRef.current; // Capture ref to maintain narrowing
        if (!canvas) return;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const displayName = (denizen.entityClass || denizen.entityName || denizen.name).toLowerCase().replace(/\s+/g, '-');
            link.download = `${displayName}-atlas-card.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url); // Clean up object URL to prevent memory leak
          }
        }, 'image/png');
      },
      /**
       * Export animated canvas as video file (MP4 or WebM).
       * 
       * WHY captureStream: Native browser API that captures canvas frames as video stream.
       * More reliable than html2canvas for animated content and doesn't have CORS limitations.
       * 
       * WHY 24fps: Balance between file size and smoothness. 24fps is standard for web video
       * and reduces export file size compared to 60fps while maintaining visual quality.
       * 
       * WHY 12 seconds: One complete scan line animation cycle. Ensures exported video
       * shows full animation without cutting off mid-cycle.
       */
      exportVideo: async () => {
        // Capture canvas ref immediately after null check to maintain narrowing across await
        // WHY: TypeScript doesn't maintain null narrowing across await boundaries
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const fps = 24;
        const duration = 12000; // 12 seconds for one full scan cycle (one complete scan line animation cycle)
        
        // Ensure video is playing if it exists - required for captureStream to record video frames
        // WHY: MediaRecorder captures whatever is currently rendered. If video is paused,
        // we'd record a static frame instead of animated video background.
        if (isVideo && videoRef.current) {
          const video = videoRef.current; // Capture ref to maintain narrowing across async
          video.play().catch(() => {
            // Silently fail - video may already be playing or autoplay blocked
            // Export will still work, just without video background animation
          });
        }
        
        try {
          // captureStream creates a MediaStream from canvas - native browser API
          const stream = canvas.captureStream(fps);
          if (typeof MediaRecorder === 'undefined') {
            throw new Error('MediaRecorder not supported in this browser');
          }
          
          // Try MP4 first (H.264) for maximum compatibility, fallback to WebM (VP9/VP8)
          // WHY: MP4 is most shareable format, but browser support varies. WebM is fallback.
          let mimeType = 'video/mp4';
          let fileExtension = 'mp4';
          
          if (!MediaRecorder.isTypeSupported('video/mp4')) {
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
              mimeType = 'video/webm;codecs=vp9'; // VP9 is better quality than VP8
              fileExtension = 'webm';
            } else {
              mimeType = 'video/webm'; // VP8 fallback
              fileExtension = 'webm';
            }
          }
          
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 8000000,
          });
          
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };
          
          return new Promise<void>((resolve, reject) => {
            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: mimeType });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const displayName = (denizen.entityClass || denizen.entityName || denizen.name).toLowerCase().replace(/\s+/g, '-');
              link.download = `${displayName}-atlas-card.${fileExtension}`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              resolve();
            };
            
            mediaRecorder.onerror = (e) => {
              reject(new Error('MediaRecorder error'));
            };
            
            mediaRecorder.start();
            
            // Stop after duration
            setTimeout(() => {
              if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
              }
            }, duration);
          });
        } catch (error) {
          throw new Error(`Failed to export video: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
    }));

    /**
     * Initialize text layout cache once fonts are loaded.
     * 
     * WHY separate effect: Text measurements must happen after fonts are loaded
     * to get accurate widths. We calculate all text positions once and cache them,
     * preventing frame-by-frame measurement variations that cause text jumping.
     */
    useEffect(() => {
      let cancelled = false;

      const initTextLayout = async () => {
        // Wait for fonts to be fully loaded
        if (typeof document !== 'undefined' && (document as any).fonts) {
          await (document as any).fonts.ready;
        }

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Ensure clean transform for measuring (transform-agnostic)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Measure all text once with correct font settings
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        // Header measurements
        ctx.font = '9px monospace';
        const atlasResearchWidth = ctx.measureText('ATLAS RESEARCH').width;
        const modeLabelWidth = ctx.measureText('MODE: ').width;
        const modeValueWidth = ctx.measureText('ACTIVE SCAN').width;
        const sigLabelWidth = ctx.measureText('SIG: ').width;
        const sigValueWidth = ctx.measureText('0.000').width; // Max width for signal
        const epochMaxWidth = ctx.measureText('EPOCH: 9999.9999').width; // Max width for epoch
        const timeMaxWidth = ctx.measureText('[00:00:00]').width; // Max width for time

        // Calculate header positions (left-to-right chaining)
        const headerStartX = 12;
        const headerGap = 16;
        const atlasResearchX = headerStartX;
        const modeLabelX = atlasResearchX + atlasResearchWidth + headerGap;
        const modeValueX = modeLabelX + modeLabelWidth;
        const sigLabelX = modeValueX + modeValueWidth + headerGap;
        const sigValueX = sigLabelX + sigLabelWidth;

        // Right side of header (right-aligned anchors)
        const headerRightMargin = 12;
        const headerRightGap = 60;
        const timeX = CARD_WIDTH - headerRightMargin; // Right-aligned anchor
        const epochX = timeX - timeMaxWidth - headerRightGap; // Fixed anchor for epoch

        // Parameter column positions (fixed anchors)
        const leftColX = 8;
        const rightColX = CARD_WIDTH - 150 + 8; // 150px wide column, 8px padding

        // Visualization positions (cache to prevent floating point precision issues)
        const sectionHeight = 758 / 3; // Cache this calculation
        const leftVizX = 0;
        const leftVizWidth = 150;
        const rightVizX = 570;
        const rightVizWidth = 150;
        const phaseY = 32;
        const phaseHeight = sectionHeight;
        const phaseCx = leftVizX + leftVizWidth / 2;
        const phaseCy = phaseY + phaseHeight / 2;
        const superY = phaseY + sectionHeight;
        const superHeight = sectionHeight;
        const superCx = leftVizX + leftVizWidth / 2;
        const superCy = superY + superHeight / 2;
        const superWidth = leftVizWidth * 0.7;
        const hallucY = superY + sectionHeight;
        const hallucHeight = sectionHeight;
        const hallucCx = leftVizX + leftVizWidth / 2;
        const hallucCy = hallucY + hallucHeight / 2;
        const coordsY = 32;
        const coordsHeight = sectionHeight;
        const coordsCx = rightVizX + rightVizWidth / 2;
        const coordsCy = coordsY + coordsHeight / 2;
        const manifoldY = coordsY + sectionHeight;
        const manifoldHeight = sectionHeight;
        const manifoldCx = rightVizX + rightVizWidth / 2;
        const manifoldCy = manifoldY + manifoldHeight / 2;
        const spectralY = manifoldY + sectionHeight; // This was being recalculated every frame!
        const spectralHeight = sectionHeight;
        const spectralCx = rightVizX + rightVizWidth / 2;
        const spectralWidth = rightVizWidth * 0.7;
        // Anchor bars to bottom of panel (matches UI) - snap to pixel grid for stability
        const SPECTRAL_BASE_PADDING = 12;
        const spectralBaseY = Math.floor((spectralY + spectralHeight - SPECTRAL_BASE_PADDING) / GRID) * GRID;

        // Footer positions
        const footerY = 790;
        const footerLeftX = 28;
        ctx.font = '9px monospace';
        const classLabelWidth = ctx.measureText('CLASS ').width;
        const threatLabelWidth = ctx.measureText('THREAT ').width;
        const descX = 180 + 28 + 24; // Fixed position for description
        const descMaxWidth = CARD_WIDTH - descX - 28;

        // Build layout cache
        textLayoutRef.current = {
          header: {
            atlasResearchX,
            modeLabelX,
            modeValueX,
            sigLabelX,
            sigValueX,
            epochX,
            timeX,
            timeMaxWidth,
          },
          params: {
            leftColX,
            rightColX,
            // Left column labels - derived from section anchors
            phaseStateLabelY: Math.round(phaseY + 16),
            superpositionLabelY: Math.round(superY + 16),
            hallucinationLabelY: Math.round(hallucY + 16),
            tempValueY: Math.round(phaseY + 28),
            highValueY: Math.round(hallucY + 28),
            // Right column labels - explicit, no assumptions about symmetry
            latentPositionLabelY: Math.round(coordsY + 16),
            manifoldLabelY: Math.round(manifoldY + 16),
            embeddingLabelY: Math.round(spectralY + 16),
            coordsValueY: Math.round(coordsY + 28),
            zValueY: Math.round(coordsY + 40),
            manifoldValueY: Math.round(manifoldY + 28),
          },
          footer: {
            nameX: footerLeftX,
            classLabelX: footerLeftX,
            classValueX: footerLeftX + classLabelWidth,
            threatLabelX: footerLeftX,
            threatValueX: footerLeftX + threatLabelWidth,
            coordX: footerLeftX,
            descX,
            descMaxWidth,
          },
          visualizations: {
            sectionHeight,
            leftVizX,
            leftVizWidth,
            rightVizX,
            rightVizWidth,
            phaseY,
            phaseHeight,
            phaseCx,
            phaseCy,
            superY,
            superHeight,
            superCx,
            superCy,
            superWidth,
            hallucY,
            hallucHeight,
            hallucCx,
            hallucCy,
            coordsY,
            coordsHeight,
            coordsCx,
            coordsCy,
            manifoldY,
            manifoldHeight,
            manifoldCx,
            manifoldCy,
            spectralY,
            spectralHeight,
            spectralCx,
            spectralWidth,
            spectralBaseY,
          },
        };

        ctx.restore();
        
        // Build static text layer once layout is ready
        buildStaticTextLayer();
      };

      initTextLayout();

      return () => {
        cancelled = true;
      };
    }, [denizen.firstObserved]); // Re-initialize if epoch changes

    /**
     * Build static text layer - render all static text once to offscreen canvas.
     * This eliminates frame-by-frame text rendering variations.
     * 
     * WHY offscreen canvas: By rendering static text once and compositing it every frame,
     * we eliminate any possibility of browser font rendering variations between frames.
     * The same bitmap is reused, ensuring pixel-perfect consistency in video exports.
     */
    const buildStaticTextLayer = useCallback(() => {
      const layout = textLayoutRef.current;
      if (!layout) return;

      const dpr = window.devicePixelRatio || 1;
      const canvas = staticTextCanvasRef.current || (staticTextCanvasRef.current = document.createElement('canvas'));
      canvas.width = CARD_WIDTH * dpr;
      canvas.height = CARD_HEIGHT * dpr;

      const tctx = canvas.getContext('2d');
      if (!tctx) return;

      // Set transform to match main canvas
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Clear canvas
      tctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Set text rendering state
      tctx.textBaseline = 'top';
      tctx.textAlign = 'left';

      // Header static text
      tctx.font = '9px monospace';
      tctx.fillStyle = '#CAA554';
      tctx.fillText('ATLAS RESEARCH', layout.header.atlasResearchX, 11);
      
      tctx.fillStyle = 'rgba(236, 227, 214, 0.3)';
      tctx.fillText('MODE: ', layout.header.modeLabelX, 11);
      tctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
      tctx.fillText('ACTIVE SCAN', layout.header.modeValueX, 11);
      
      tctx.fillStyle = 'rgba(236, 227, 214, 0.3)';
      tctx.fillText('SIG: ', layout.header.sigLabelX, 11);
      // Signal strength is static for a given denizen, so render it here
      const signalStrength = ((denizen.coordinates.geometry + 1) / 2).toFixed(3);
      tctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
      tctx.fillText(signalStrength, layout.header.sigValueX, 11);
      
      // Epoch (static)
      tctx.textAlign = 'right';
      tctx.fillStyle = 'rgba(236, 227, 214, 0.3)';
      const epoch = denizen.firstObserved || '4.2847';
      const epochText = `EPOCH: ${epoch}`;
      tctx.fillText(epochText, layout.header.epochX, 11);
      tctx.textAlign = 'left';

      // Parameter labels
      tctx.font = '9px monospace';
      tctx.fillStyle = 'rgba(236, 227, 214, 0.4)';
      tctx.fillText('PHASE STATE', layout.params.leftColX, layout.params.phaseStateLabelY);
      tctx.fillText('SUPERPOSITION', layout.params.leftColX, layout.params.superpositionLabelY);
      tctx.fillText('HALLUCINATION INDEX', layout.params.leftColX, layout.params.hallucinationLabelY);

      // Parameter values (static for a given denizen)
      const tempValue = ((denizen.coordinates.dynamics + 1) / 2).toFixed(2);
      const hallucinationScore = Math.round((denizen.coordinates.dynamics + 1) * 2.5);
      tctx.fillStyle = '#CAA554';
      tctx.fillText(`TEMP: ${tempValue}`, layout.params.leftColX, layout.params.tempValueY);
      tctx.fillStyle = '#C17F59';
      tctx.fillText(`HIGH [${hallucinationScore}/5]`, layout.params.leftColX, layout.params.highValueY);

      // Right column labels - use explicit right-column Y positions
      tctx.fillStyle = 'rgba(236, 227, 214, 0.4)';
      tctx.fillText('LATENT POSITION', layout.params.rightColX, layout.params.latentPositionLabelY);
      tctx.fillText('MANIFOLD CURVATURE', layout.params.rightColX, layout.params.manifoldLabelY);
      tctx.fillText('EMBEDDING SIGNATURE', layout.params.rightColX, layout.params.embeddingLabelY);

      // Right column values (static)
      tctx.font = '8px monospace';
      tctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
      const coordsText = `X:${denizen.coordinates.geometry.toFixed(3)} Y:${denizen.coordinates.alterity.toFixed(3)}`;
      tctx.fillText(coordsText, layout.params.rightColX, layout.params.coordsValueY);
      tctx.fillText(`Z:${denizen.coordinates.dynamics.toFixed(3)}`, layout.params.rightColX, layout.params.zValueY);
      
      tctx.font = '9px monospace';
      const manifoldValue = denizen.threatLevel === 'Volatile' || denizen.threatLevel === 'Existential' ? 'SEVERE' : 'NOMINAL';
      tctx.fillStyle = denizen.threatLevel === 'Volatile' || denizen.threatLevel === 'Existential' ? '#C17F59' : '#5B8A7A';
      tctx.fillText(manifoldValue, layout.params.rightColX, layout.params.manifoldValueY);

      // Footer static text
      const footerY = 790;
      tctx.font = '24px monospace';
      tctx.fillStyle = '#CAA554';
      const displayName = (denizen.entityClass || denizen.entityName || denizen.name).toUpperCase();
      tctx.fillText(displayName, layout.footer.nameX, footerY + 16);
      
      tctx.font = '9px monospace';
      tctx.fillStyle = 'rgba(236, 227, 214, 0.3)';
      tctx.fillText('CLASS ', layout.footer.classLabelX, footerY + 48);
      tctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
      tctx.fillText(denizen.type.toUpperCase(), layout.footer.classValueX, footerY + 48);
      
      tctx.fillStyle = 'rgba(236, 227, 214, 0.3)';
      tctx.fillText('THREAT ', layout.footer.threatLabelX, footerY + 60);
      const threatColor = denizen.threatLevel === 'Volatile' || denizen.threatLevel === 'Existential' ? '#C17F59' : 'rgba(236, 227, 214, 0.5)';
      tctx.fillStyle = threatColor;
      tctx.fillText(denizen.threatLevel.toUpperCase(), layout.footer.threatValueX, footerY + 60);
      
      // Coordinates in footer
      tctx.fillStyle = 'rgba(236, 227, 214, 0.3)';
      const coordText = `◆ ${denizen.coordinates.geometry.toFixed(3)} ○ ${denizen.coordinates.alterity.toFixed(3)} ◇ ${denizen.coordinates.dynamics.toFixed(3)}`;
      tctx.fillText(coordText, layout.footer.coordX, footerY + 72);
      
      // Description in footer (static)
      tctx.font = '13px sans-serif';
      tctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
      const words = denizen.description.split(' ');
      let line = '';
      let y = footerY + 16;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = tctx.measureText(testLine);
        if (metrics.width > layout.footer.descMaxWidth && line.length > 0) {
          tctx.fillText(line, layout.footer.descX, y);
          line = word + ' ';
          y += 20;
        } else {
          line = testLine;
        }
      }
      if (line.length > 0) {
        tctx.fillText(line, layout.footer.descX, y);
      }

      staticTextBuiltRef.current = true;
    }, [denizen]);

    // Rebuild static text layer when denizen changes
    useEffect(() => {
      if (textLayoutRef.current) {
        buildStaticTextLayer();
      }
    }, [denizen, buildStaticTextLayer]);

    /**
     * Load media (video or image) for canvas rendering.
     * 
     * WHY separate effect: Media loading is async and independent of rendering loop.
     * We load media first, then render loop uses it when ready. This prevents
     * render loop from blocking on media loading and allows proper cleanup.
     * 
     * WHY off-screen video: Video element must be in DOM for canvas.drawImage() to work,
     * but we don't want it visible. Positioned off-screen to avoid layout impact.
     * 
     * WHY crossOrigin: Required for canvas to read video/image pixels without CORS errors
     * during export (canvas.toBlob() and captureStream() require CORS-compliant media).
     */
    useEffect(() => {
      if (!mediaUrl) {
        mediaLoadedRef.current = false;
        return;
      }

      mediaLoadedRef.current = false;

      if (isVideo) {
        // Load video element for canvas.drawImage()
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // Required for canvas export without CORS errors
        video.src = mediaUrl;
        video.muted = true; // Required for autoplay in most browsers
        video.loop = true; // Continuous playback for video export
        video.playsInline = true; // Prevents fullscreen on mobile
        video.preload = 'metadata'; // Load enough to get dimensions
        
        // Position off-screen: video must be in DOM for drawImage, but shouldn't be visible
        video.style.position = 'absolute';
        video.style.left = '-9999px';
        video.style.top = '-9999px';
        document.body.appendChild(video);

        video.onloadedmetadata = () => {
          // Start playback immediately so video is ready when render loop needs it
          // WHY: Canvas.drawImage() needs video to be playing to capture current frame
          video.play().catch(() => {
            // Autoplay may be blocked - render loop will handle paused state
          });
          videoRef.current = video;
          mediaLoadedRef.current = true;
        };

        video.onerror = () => {
          // Clean up on error to prevent memory leaks
          if (video.parentNode) {
            document.body.removeChild(video);
          }
          mediaLoadedRef.current = false;
        };

        return () => {
          // Cleanup: remove video element when mediaUrl changes or component unmounts
          if (video.parentNode) {
            document.body.removeChild(video);
          }
          videoRef.current = null;
        };
      } else {
        // Load image - prefer thumbnail for videos, fallback to mediaUrl for images
        // WHY: Thumbnails are pre-extracted and avoid CORS issues during export
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Required for canvas export without CORS errors
        img.src = thumbnailUrl || mediaUrl;

        img.onload = () => {
          imageRef.current = img;
          mediaLoadedRef.current = true;
        };

        img.onerror = () => {
          // Image failed to load - render loop will show background color only
          mediaLoadedRef.current = false;
        };

        return () => {
          imageRef.current = null;
        };
      }
    }, [mediaUrl, thumbnailUrl, isVideo]);

    /**
     * Main rendering loop - draws entire card to canvas every frame.
     * 
     * WHY single render loop: All elements drawn in one pass ensures perfect
     * layering and synchronization. Multiple render passes would cause flickering
     * and alignment issues.
     * 
     * WHY willReadFrequently: Canvas is used for export (toBlob, captureStream),
     * which reads pixel data frequently. This hint optimizes canvas for read operations.
     * 
     * WHY devicePixelRatio: High-DPI displays need 2x/3x resolution to render
     * crisp text and lines. We scale context back down so coordinates match CSS pixels.
     */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set up canvas with device pixel ratio for crisp rendering on high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = CARD_WIDTH * dpr;
      canvas.height = CARD_HEIGHT * dpr;
      canvas.style.width = `${CARD_WIDTH}px`;
      canvas.style.height = `${CARD_HEIGHT}px`;

      // willReadFrequently optimizes for export operations (toBlob, captureStream)
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      timeRef.current = 0;
      staticTextBuiltRef.current = false; // Reset static text flag when canvas is recreated

      /**
       * Rendering loop - draws all layers in correct order (bottom to top).
       * 
       * Render order matters: Each layer draws on top of previous layers.
       * Order: Background → Gradient → Panels → Text → Visualizations → Scan line → Border
       * 
       * WHY requestAnimationFrame: Synchronizes with browser repaint (60fps),
       * ensures smooth animations, and pauses when tab is hidden (saves CPU).
       * 
       * WHY setTransform every frame: Ensures transform state is identical every frame,
       * preventing subpixel differences from leaking between frames.
       */
      const render = () => {
        // Always start from the same transform - hard reset every frame
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear canvas with card background color - must be first to reset previous frame
        ctx.fillStyle = '#050403';
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

        // Phase 2: Background media rendering (bottom layer)
        // WHY check readyState >= 2: Video must have loaded metadata (dimensions) before drawImage works
        // WHY check image.complete: Image must be fully loaded before drawImage works
        if (mediaLoadedRef.current && mediaUrl) {
          if (isVideo && videoRef.current && videoRef.current.readyState >= 2) {
            const video = videoRef.current; // Capture ref to maintain narrowing
            const { sx, sy, sWidth, sHeight } = getCoverDimensions(
              video.videoWidth,
              video.videoHeight,
              CARD_WIDTH,
              CARD_HEIGHT
            );
            // Draw current video frame with object-fit: cover math
            ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, CARD_WIDTH, CARD_HEIGHT);
          } else if (!isVideo && imageRef.current && imageRef.current.complete) {
            const img = imageRef.current; // Capture ref to maintain narrowing
            const { sx, sy, sWidth, sHeight } = getCoverDimensions(
              img.width,
              img.height,
              CARD_WIDTH,
              CARD_HEIGHT
            );
            // Draw image with object-fit: cover math
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, CARD_WIDTH, CARD_HEIGHT);
          }
        }

        // Gradient overlay for readability
        const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
        gradient.addColorStop(0, 'rgba(5, 4, 3, 0.4)');
        gradient.addColorStop(0.5, 'rgba(5, 4, 3, 0.2)');
        gradient.addColorStop(1, 'rgba(5, 4, 3, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

        // Phase 3: Text rendering
        // Skip if text layout not initialized yet
        const layout = textLayoutRef.current;
        if (!layout) {
          requestAnimationFrame(render);
          return;
        }

        // Composite static text layer (rendered once, reused every frame)
        if (staticTextCanvasRef.current && staticTextBuiltRef.current) {
          ctx.drawImage(staticTextCanvasRef.current, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }

        // Only draw dynamic text (time) - everything else is in static layer
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
        const timeText = `[${formatTime(elapsedTimeRef.current)}]`;
        ctx.fillText(timeText, layout.header.timeX, 11);

        // Phase 4: Glassmorphism panels
        // WHY simple translucent fill: Canvas doesn't support backdrop-filter CSS property.
        // We simulate glassmorphism with semi-transparent fills that approximate the visual
        // effect. True blur would require expensive off-screen canvas operations every frame.
        // 
        // Header panel (full width, 32px tall)
        ctx.fillStyle = 'rgba(10, 9, 8, 0.1)';
        ctx.fillRect(0, 0, CARD_WIDTH, 32);
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(CARD_WIDTH, 32);
        ctx.stroke();

        // Left column panel (150px wide, from y=32 to y=790)
        ctx.fillStyle = 'rgba(5, 4, 3, 0.03)';
        ctx.fillRect(0, 32, 150, 758);
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.08)';
        ctx.beginPath();
        ctx.moveTo(150, 32);
        ctx.lineTo(150, 790);
        ctx.stroke();

        // Right column panel (150px wide, from x=570, y=32 to y=790)
        ctx.fillStyle = 'rgba(5, 4, 3, 0.03)';
        ctx.fillRect(570, 32, 150, 758);
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.08)';
        ctx.beginPath();
        ctx.moveTo(570, 32);
        ctx.lineTo(570, 790);
        ctx.stroke();

        // Footer panel (full width, 110px tall, starts at y=790)
        ctx.fillStyle = 'rgba(10, 9, 8, 0.1)';
        ctx.fillRect(0, 790, CARD_WIDTH, 110);
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.12)';
        ctx.beginPath();
        ctx.moveTo(0, 790);
        ctx.lineTo(CARD_WIDTH, 790);
        ctx.stroke();

        // Footer divider
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.08)';
        ctx.beginPath();
        ctx.moveTo(180 + 28, 790);
        ctx.lineTo(180 + 28, 900);
        ctx.stroke();

        // Panel section dividers (left column)
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.06)';
        const leftSectionHeight = 758 / 3;
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 32 + leftSectionHeight * i);
          ctx.lineTo(150, 32 + leftSectionHeight * i);
          ctx.stroke();
        }

        // Panel section dividers (right column)
        const rightSectionHeight = 758 / 3;
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(570, 32 + rightSectionHeight * i);
          ctx.lineTo(720, 32 + rightSectionHeight * i);
          ctx.stroke();
        }

        // Phase 5: Canvas visualizations
        // WHY initialize in render loop: Particles need canvas dimensions to be set first.
        // Lazy initialization ensures we only create particles once canvas is ready,
        // and prevents re-initialization on every render (refs persist across renders).
        if (phaseStateRef.current.particles.length === 0) {
          for (let i = 0; i < 50; i++) {
            phaseStateRef.current.particles.push({ 
              t: Math.random() * Math.PI * 8, 
              life: Math.random(), 
              decay: 0.0005 + Math.random() * 0.001 
            });
          }
        }
        if (hallucStateRef.current.ghosts.length === 0) {
          for (let i = 0; i < 12; i++) {
            hallucStateRef.current.ghosts.push({
              angle: Math.random() * Math.PI * 2,
              drift: 0.002 + Math.random() * 0.003,
              dist: 0.3 + Math.random() * 0.4,
              flicker: Math.random() * Math.PI * 2,
            });
          }
        }
        if (coordsStateRef.current.particles.length === 0) {
          for (let i = 0; i < 40; i++) {
            coordsStateRef.current.particles.push({
              x: Math.random(),
              y: Math.random(),
              z: Math.random(),
              vx: (Math.random() - 0.5) * 0.002,
              vy: (Math.random() - 0.5) * 0.002,
              vz: (Math.random() - 0.5) * 0.002,
              life: Math.random(),
            });
          }
        }
        if (manifoldStateRef.current.particles.length === 0) {
          for (let i = 0; i < 60; i++) {
            manifoldStateRef.current.particles.push({
              baseX: Math.random(),
              baseY: Math.random(),
            });
          }
        }
        if (spectralStateRef.current.signature.length === 0) {
          for (let i = 0; i < 20; i++) {
            spectralStateRef.current.signature.push({
              base: 0.3 + Math.random() * 0.4,
              variance: 0.1 + Math.random() * 0.2,
            });
          }
        }

        // Left column visualizations - use cached positions
        if (!layout.visualizations) {
          requestAnimationFrame(render);
          return;
        }
        const viz = layout.visualizations;

        // Phase State (top left, ~252px tall)
        const temp = (denizen.coordinates.geometry + 1) / 2;
        const freqRatio = 1 + temp * 2.5;
        
        ctx.fillStyle = 'rgba(5, 4, 3, 0.05)';
        ctx.fillRect(viz.leftVizX, viz.phaseY, viz.leftVizWidth, viz.phaseHeight);
        
        drawParticleLine(ctx, viz.phaseCx, viz.phaseY, viz.phaseCx, viz.phaseY + viz.phaseHeight, GOLD, 0.08, 0.15);
        drawParticleLine(ctx, viz.leftVizX, viz.phaseCy, viz.leftVizX + viz.leftVizWidth, viz.phaseCy, GOLD, 0.08, 0.15);
        
        phaseStateRef.current.particles.forEach(p => {
          const noise = temp * Math.sin(p.t * 8 + phaseStateRef.current.time) * 0.08;
          const x = viz.phaseCx + Math.sin(p.t + phaseStateRef.current.time) * (viz.leftVizWidth * 0.38) * (1 + noise);
          const y = viz.phaseCy + Math.sin(p.t * freqRatio + phaseStateRef.current.time * 0.7) * (viz.phaseHeight * 0.38) * (1 + noise);
          drawPixel(ctx, x, y, GOLD, p.life * 0.45);
          p.t += 0.015;
          p.life -= p.decay;
          if (p.life <= 0) {
            p.life = 1;
            p.t = phaseStateRef.current.time * 1.5 + Math.random() * 0.5;
          }
        });
        
        const headX = viz.phaseCx + Math.sin(phaseStateRef.current.time) * (viz.leftVizWidth * 0.38);
        const headY = viz.phaseCy + Math.sin(phaseStateRef.current.time * freqRatio) * (viz.phaseHeight * 0.38);
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 5;
          drawPixel(ctx, headX + Math.cos(angle) * dist, headY + Math.sin(angle) * dist, GOLD, 0.2 + Math.random() * 0.15);
        }
        drawPixel(ctx, headX, headY, GOLD, 0.8, 4);
        phaseStateRef.current.time += 0.004;

        // Superposition (middle left, ~252px tall)
        ctx.fillStyle = 'rgba(5, 4, 3, 0.08)';
        ctx.fillRect(viz.leftVizX, viz.superY, viz.leftVizWidth, viz.superHeight);
        
        const waves = [
          { weight: 0.34, freq: 1.0, color: DYNAMICS },
          { weight: 0.28, freq: 1.5, color: GOLD },
          { weight: 0.22, freq: 2.2, color: VOLATILE },
        ];
        
        waves.forEach((wave, idx) => {
          const offsetY = viz.superCy + (idx - 1) * (viz.superHeight * 0.25);
          for (let x = 0; x < viz.superWidth; x += 2) {
            const t = (x / viz.superWidth) * Math.PI * 4 + superStateRef.current.time * wave.freq;
            const y = offsetY + Math.sin(t) * (viz.superHeight * 0.15) * wave.weight;
            drawPixel(ctx, viz.superCx - viz.superWidth / 2 + x, y, wave.color, 0.4 + Math.sin(t) * 0.2);
          }
        });
        superStateRef.current.time += 0.008;

        // Hallucination Index (bottom left, ~252px tall)
        const maxR = Math.min(viz.leftVizWidth, viz.hallucHeight) * 0.45;
        
        ctx.fillStyle = 'rgba(5, 4, 3, 0.08)';
        ctx.fillRect(viz.leftVizX, viz.hallucY, viz.leftVizWidth, viz.hallucHeight);
        
        [0.33, 0.66, 1.0].forEach(r => {
          drawParticleCircle(ctx, viz.hallucCx, viz.hallucCy, maxR * r, GOLD, 0.2, 0.12);
        });
        
        const sweepAngle = hallucStateRef.current.time * 0.5;
        for (let i = 0; i < 20; i++) {
          const r = (i / 20) * maxR;
          const fade = 1 - (i / 20) * 0.5;
          const x = viz.hallucCx + Math.cos(sweepAngle) * r;
          const y = viz.hallucCy + Math.sin(sweepAngle) * r;
          drawPixel(ctx, x, y, GOLD, 0.6 * fade);
        }
        
        hallucStateRef.current.ghosts.forEach(ghost => {
          ghost.angle += ghost.drift;
          const flicker = 0.4 + Math.sin(hallucStateRef.current.time * 1.5 + ghost.flicker) * 0.2;
          const gx = viz.hallucCx + Math.cos(ghost.angle) * maxR * ghost.dist;
          const gy = viz.hallucCy + Math.sin(ghost.angle) * maxR * ghost.dist;
          for (let i = 0; i < 4; i++) {
            const ox = (Math.random() - 0.5) * 6;
            const oy = (Math.random() - 0.5) * 6;
            drawPixel(ctx, gx + ox, gy + oy, VOLATILE, flicker * 0.6);
          }
        });
        
        drawPixel(ctx, viz.hallucCx, viz.hallucCy, GOLD, 0.9, 4);
        hallucStateRef.current.time += 0.006;

        // Right column visualizations - use cached positions

        // Latent Position (top right, ~252px tall)
        ctx.fillStyle = 'rgba(5, 4, 3, 0.12)';
        ctx.fillRect(viz.rightVizX, viz.coordsY, viz.rightVizWidth, viz.coordsHeight);
        
        coordsStateRef.current.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
          if (p.z < 0 || p.z > 1) p.vz *= -1;
          p.x = Math.max(0, Math.min(1, p.x));
          p.y = Math.max(0, Math.min(1, p.y));
          p.z = Math.max(0, Math.min(1, p.z));
          
          const x = viz.rightVizX + p.x * viz.rightVizWidth;
          const y = viz.coordsY + p.y * viz.coordsHeight;
          const alpha = 0.3 + p.z * 0.4;
          drawPixel(ctx, x, y, GOLD, alpha * p.life);
          p.life = Math.max(0.3, p.life - 0.001);
          if (p.life <= 0.3) p.life = 1;
        });

        // Manifold Curvature (middle right, ~252px tall)
        const strength = 30 + Math.sin(manifoldStateRef.current.time * 0.5) * 5;
        
        ctx.fillStyle = 'rgba(5, 4, 3, 0.12)';
        ctx.fillRect(viz.rightVizX, viz.manifoldY, viz.rightVizWidth, viz.manifoldHeight);
        
        manifoldStateRef.current.particles.forEach(p => {
          const x = p.baseX * viz.rightVizWidth;
          const y = p.baseY * viz.manifoldHeight;
          const dx = x - viz.rightVizWidth / 2;
          const dy = y - viz.manifoldHeight / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pull = Math.max(0, 1 - dist / 70) * strength;
          const warpedX = viz.rightVizX + x + (dx / (dist || 1)) * pull;
          const warpedY = viz.manifoldY + y + (dy / (dist || 1)) * pull;
          const alpha = 0.3 + (dist / 100) * 0.4;
          drawPixel(ctx, warpedX, warpedY, GOLD, alpha);
        });
        
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 20;
          const alpha = 0.3 * (1 - dist / 20);
          drawPixel(ctx, viz.manifoldCx + Math.cos(angle) * dist, viz.manifoldCy + Math.sin(angle) * dist, VOLATILE, alpha);
        }
        
        drawPixel(ctx, viz.manifoldCx, viz.manifoldCy, VOLATILE, 0.9, 4);
        manifoldStateRef.current.time += 0.008;

        // Embedding Signature (bottom right, ~252px tall) - use cached positions to prevent jumping
        const barCount = spectralStateRef.current.signature.length;
        const barWidth = viz.spectralWidth / barCount;
        
        ctx.fillStyle = 'rgba(5, 4, 3, 0.12)';
        ctx.fillRect(viz.rightVizX, viz.spectralY, viz.rightVizWidth, viz.spectralHeight);
        
        spectralStateRef.current.signature.forEach((sig, i) => {
          const height = (sig.base + Math.sin(spectralStateRef.current.time * 2 + i) * sig.variance) * viz.spectralHeight * 0.6;
          const x = viz.spectralCx - viz.spectralWidth / 2 + i * barWidth;
          // Use cached bottom baseline - bars grow upward from bottom of panel (matches UI)
          const y = viz.spectralBaseY;
          const color = i % 3 === 0 ? DYNAMICS : GOLD;
          for (let h = 0; h < height; h += GRID) {
            drawPixel(ctx, x + barWidth / 2, y - h, color, 0.5 + Math.sin(spectralStateRef.current.time * 3 + i + h) * 0.3);
          }
        });
        spectralStateRef.current.time += 0.01;

        // Phase 6: Scan line animation
        // WHY 12 second cycle: Matches the scan line animation duration in DOM version.
        // Video exports capture exactly one full cycle (12 seconds) for consistency.
        // WHY timeRef * 0.016: timeRef increments by ~0.016 each frame (60fps), so
        // timeRef.current * 0.016 gives elapsed time in seconds.
        const scanTime = (timeRef.current * 0.016) % 12; // 12 second cycle
        const scanY = (scanTime / 12) * CARD_HEIGHT;
        
        // Fade in/out at top and bottom edges for smooth visual effect
        const scanOpacity = scanY < CARD_HEIGHT * 0.05 ? (scanY / (CARD_HEIGHT * 0.05)) * 0.6 :
                           scanY > CARD_HEIGHT * 0.95 ? ((CARD_HEIGHT - scanY) / (CARD_HEIGHT * 0.05)) * 0.6 : 0.6;
        
        if (scanOpacity > 0) {
          // Gradient from opaque to transparent creates soft scan line edge
          const gradient = ctx.createLinearGradient(0, scanY, 0, scanY + 2);
          gradient.addColorStop(0, `rgba(202, 165, 84, ${scanOpacity})`);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, scanY, CARD_WIDTH, 2);
        }

        // Card border
        ctx.strokeStyle = 'rgba(236, 227, 214, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

        timeRef.current += 0.016; // ~60fps
        
        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [denizen, mediaUrl, thumbnailUrl, isVideo]); // Removed elapsedTime - render loop is now continuous

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
        }}
      />
    );
  }
);

DenizenCardCanvas.displayName = 'DenizenCardCanvas';

