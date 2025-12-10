'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EntityFormData } from '@/app/admin/new-entity/page';
import { MediaUploadZone } from '@/components/admin/MediaUploadZone';
import styles from './EntityCardPreview.module.css';

// Particle system constants
const GRID = 3;
const GOLD = '202, 165, 84';
const DAWN = '236, 227, 214';
const DYNAMICS = '91, 138, 122';
const VOLATILE = '193, 127, 89';

interface EntityCardPreviewProps {
  formData: EntityFormData;
  onMediaAnalyzed?: (data: Partial<EntityFormData> & { visualNotes?: string }) => void;
  isAnalyzing?: boolean;
  setIsAnalyzing?: (analyzing: boolean) => void;
  onClearMedia?: () => void;
}

export function EntityCardPreview({
  formData,
  onMediaAnalyzed,
  isAnalyzing,
  setIsAnalyzing,
  onClearMedia,
}: EntityCardPreviewProps) {
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const superCanvasRef = useRef<HTMLCanvasElement>(null);
  const hallucCanvasRef = useRef<HTMLCanvasElement>(null);
  const coordsCanvasRef = useRef<HTMLCanvasElement>(null);
  const manifoldCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectralCanvasRef = useRef<HTMLCanvasElement>(null);
  const centerCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const stateRef = useRef({
    phasePoints: [] as { phase: number; amp: number; freq: number }[],
    superStates: [] as { active: boolean; phase: number }[],
    hallucHistory: [] as number[],
    manifoldParticles: [] as { baseX: number; baseY: number }[],
    signature: [] as { base: number; variance: number }[],
    fieldParticles: [] as { x: number; y: number; vx: number; vy: number; alpha: number }[],
  });

  // Draw pixel helper
  const drawPixel = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    alpha: number,
    size: number = GRID
  ) => {
    const px = Math.floor(x / GRID) * GRID;
    const py = Math.floor(y / GRID) * GRID;
    ctx.fillStyle = `rgba(${color}, ${alpha})`;
    ctx.fillRect(px, py, size - 1, size - 1);
  }, []);

  // Draw particle circle
  const drawParticleCircle = useCallback((
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    color: string,
    alpha: number,
    density: number = 0.15
  ) => {
    const circumference = 2 * Math.PI * r;
    const steps = Math.floor(circumference * density);
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      drawPixel(ctx, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, color, alpha);
    }
  }, [drawPixel]);

  // Setup canvas with DPR
  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return null;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }, []);

  // Initialize visualization states
  const initStates = useCallback(() => {
    const state = stateRef.current;
    
    // Phase points
    state.phasePoints = [];
    for (let i = 0; i < 20; i++) {
      state.phasePoints.push({
        phase: Math.random() * Math.PI * 2,
        amp: 0.2 + Math.random() * 0.5,
        freq: 0.5 + Math.random() * 1.5,
      });
    }

    // Super states
    state.superStates = [];
    for (let i = 0; i < 12; i++) {
      state.superStates.push({
        active: Math.random() > 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Hallucination history
    state.hallucHistory = [];
    for (let i = 0; i < 25; i++) {
      state.hallucHistory.push(0.6 + Math.sin(i * 0.2) * 0.2 + Math.random() * 0.1);
    }

    // Manifold particles
    state.manifoldParticles = [];
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        state.manifoldParticles.push({ baseX: x / 6, baseY: y / 6 });
      }
    }

    // Spectral signature
    state.signature = [];
    for (let i = 0; i < 16; i++) {
      state.signature.push({
        base: Math.sin(i * 0.3) * 0.3 + Math.sin(i * 0.7) * 0.2 + 0.5,
        variance: Math.random() * 0.1,
      });
    }
  }, []);

  // Initialize center field particles
  const initCenterParticles = useCallback((width: number, height: number) => {
    stateRef.current.fieldParticles = [];
    for (let i = 0; i < 30; i++) {
      stateRef.current.fieldParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        alpha: 0.06 + Math.random() * 0.08,
      });
    }
  }, []);

  // Animation loop
  useEffect(() => {
    initStates();

    const animate = () => {
      const time = timeRef.current;
      const state = stateRef.current;

      // Phase State
      if (phaseCanvasRef.current) {
        const setup = setupCanvas(phaseCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          ctx.fillStyle = 'rgba(5, 4, 3, 0.15)';
          ctx.fillRect(0, 0, width, height);
          
          const baseline = height * 0.85;
          for (let x = 0; x < width; x += GRID * 2) {
            drawPixel(ctx, x, baseline, DAWN, 0.1);
          }
          
          const tempMod = 0.5 + formData.hallucinationIndex;
          state.phasePoints.forEach((p, i) => {
            const x = (i / state.phasePoints.length) * width;
            const wave = Math.sin(time * p.freq * tempMod + p.phase) * p.amp;
            const y = baseline - (wave + 0.5) * height * 0.6;
            drawPixel(ctx, x, y, GOLD, 0.5 + wave * 0.3);
            for (let ty = y; ty < baseline; ty += GRID * 2) {
              drawPixel(ctx, x, ty, GOLD, 0.06 * (1 - (ty - y) / (baseline - y)));
            }
          });
        }
      }

      // Superposition
      if (superCanvasRef.current) {
        const setup = setupCanvas(superCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          ctx.fillStyle = 'rgba(5, 4, 3, 0.08)';
          ctx.fillRect(0, 0, width, height);
          
          const cols = 4, rows = 3;
          state.superStates.forEach((s, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = (col + 0.5) * (width / cols);
            const y = (row + 0.5) * (height / rows);
            const isOn = s.active ? Math.sin(time + s.phase) > 0.3 : Math.random() > 0.97;
            if (isOn) {
              drawPixel(ctx, x, y, GOLD, 0.8, 4);
              drawPixel(ctx, x - GRID, y, GOLD, 0.15);
              drawPixel(ctx, x + GRID, y, GOLD, 0.15);
            } else {
              drawPixel(ctx, x, y, DAWN, 0.1, 4);
            }
          });
        }
      }

      // Hallucination Index
      if (hallucCanvasRef.current) {
        const setup = setupCanvas(hallucCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          ctx.fillStyle = 'rgba(5, 4, 3, 0.1)';
          ctx.fillRect(0, 0, width, height);
          
          state.hallucHistory.shift();
          const level = Math.round(formData.hallucinationIndex * 5);
          const baseValue = level / 5;
          state.hallucHistory.push(
            baseValue * 0.8 + Math.sin(time) * 0.1 + Math.sin(time * 2.3) * 0.05 + (Math.random() - 0.5) * 0.05
          );
          
          state.hallucHistory.forEach((v, i) => {
            const x = (i / state.hallucHistory.length) * width;
            const y = height - v * height * 0.85;
            drawPixel(ctx, x, y, VOLATILE, 0.7);
            for (let fy = y; fy < height; fy += GRID * 2) {
              drawPixel(ctx, x, fy, VOLATILE, 0.05);
            }
          });
        }
      }

      // Latent Position
      if (coordsCanvasRef.current) {
        const setup = setupCanvas(coordsCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          ctx.fillStyle = 'rgba(5, 4, 3, 0.12)';
          ctx.fillRect(0, 0, width, height);
          
          for (let x = 0; x < width; x += GRID * 3) {
            for (let y = 0; y < height; y += GRID * 3) {
              drawPixel(ctx, x, y, DAWN, 0.06);
            }
          }
          
          const cx = width / 2;
          const cy = height / 2;
          const entityX = cx + formData.coordinates.geometry * width * 0.35;
          const entityY = cy - formData.coordinates.alterity * height * 0.35;
          const pulse = 0.7 + Math.sin(time * 2) * 0.3;
          
          for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 6;
            drawPixel(ctx, entityX + Math.cos(angle) * dist, entityY + Math.sin(angle) * dist, GOLD, 0.1 * pulse);
          }
          drawPixel(ctx, entityX, entityY, GOLD, 0.85 * pulse, 4);
        }
      }

      // Manifold Curvature
      if (manifoldCanvasRef.current) {
        const setup = setupCanvas(manifoldCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          ctx.fillStyle = 'rgba(5, 4, 3, 0.12)';
          ctx.fillRect(0, 0, width, height);
          
          const cx = width / 2;
          const cy = height / 2;
          const severityMap: Record<string, number> = { Stable: 8, Moderate: 15, Severe: 22, Critical: 30 };
          const baseStrength = severityMap[formData.manifoldCurvature] || 18;
          const strength = baseStrength + Math.sin(time * 0.5) * 4;
          
          state.manifoldParticles.forEach(p => {
            const x = p.baseX * width;
            const y = p.baseY * height;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const pull = Math.max(0, 1 - dist / 45) * strength;
            drawPixel(ctx, x - (dx / (dist || 1)) * pull, y - (dy / (dist || 1)) * pull, GOLD, 0.2 + (dist / 50) * 0.3);
          });
          
          for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 10;
            drawPixel(ctx, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, VOLATILE, 0.2 * (1 - dist / 10));
          }
          drawPixel(ctx, cx, cy, VOLATILE, 0.9, 4);
        }
      }

      // Embedding Signature
      if (spectralCanvasRef.current) {
        const setup = setupCanvas(spectralCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          ctx.fillStyle = 'rgba(5, 4, 3, 0.08)';
          ctx.fillRect(0, 0, width, height);
          
          state.signature.forEach((band, i) => {
            const animate = Math.sin(time + i * 0.2) * band.variance;
            const h = (band.base + animate) * height * 0.8;
            const color = i / state.signature.length < 0.5 ? DYNAMICS : GOLD;
            for (let y = height; y > height - h; y -= GRID) {
              drawPixel(ctx, i * (width / state.signature.length) + (width / state.signature.length) / 2, y, color, 0.2 + (1 - y / height) * 0.35);
            }
          });
          
          const scanX = (time * 4) % width;
          for (let y = 0; y < height; y += GRID * 2) {
            drawPixel(ctx, scanX, y, DAWN, 0.2);
          }
        }
      }

      // Center Field
      if (centerCanvasRef.current) {
        const setup = setupCanvas(centerCanvasRef.current);
        if (setup) {
          const { ctx, width, height } = setup;
          
          if (state.fieldParticles.length === 0) {
            initCenterParticles(width, height);
          }
          
          ctx.fillStyle = 'rgba(5, 4, 3, 0.05)';
          ctx.fillRect(0, 0, width, height);
          
          const cx = width / 2;
          const cy = height / 2;
          
          [0.3, 0.45, 0.6].forEach(r => {
            drawParticleCircle(ctx, cx, cy, Math.min(width, height) * r * 0.45, GOLD, 0.08, 0.05);
          });
          
          state.fieldParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
            drawPixel(ctx, p.x, p.y, GOLD, p.alpha);
          });
        }
      }

      timeRef.current += 0.015;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [formData, setupCanvas, drawPixel, drawParticleCircle, initStates, initCenterParticles]);

  // Format name for display
  const displayName = formData.name ? formData.name.toUpperCase().split(' ').join('\n') : 'UNNAMED\nENTITY';
  
  // Get threat color
  const threatColors: Record<string, string> = {
    Benign: '#5B8A7A',
    Cautious: '#7A7868',
    Volatile: '#C17F59',
    Existential: '#8B5A5A',
  };
  const threatColor = threatColors[formData.threatLevel] || '#7A7868';

  // Get allegiance label
  const allegianceLabels: Record<string, string> = {
    'Liminal Covenant': '◎ LIMINAL COVENANT',
    'Nomenclate': '◎ NOMENCLATE',
    'Unaligned': '◎ UNALIGNED',
    'Unknown': '? UNKNOWN',
  };

  const isVideo = formData.mediaMimeType?.startsWith('video');

  return (
    <div className={styles.card}>
      {/* Full-bleed Media Background */}
      {formData.mediaUrl && (
        <div className={styles.mediaBackground}>
          {isVideo ? (
            <video
              src={formData.mediaUrl}
              className={styles.backgroundMedia}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
          ) : (
            <img 
              src={formData.mediaUrl} 
              alt={formData.name} 
              className={styles.backgroundMedia}
            />
          )}
          {/* Gradient overlay for readability */}
          <div className={styles.mediaOverlay} />
        </div>
      )}
      <div className={styles.scanline} />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Atlas Research</span>
        <span className={styles.headerData}>MODE: <span>Active Scan</span></span>
        <span className={styles.headerData}>SIG: <span>0.946</span></span>
        <div className={styles.headerRight}>
          <span className={styles.headerData}>EPOCH: <span>4.2847</span></span>
          <span className={styles.headerData}>[00:00:00]</span>
        </div>
      </div>

      {/* Left Column */}
      <div className={styles.leftCol}>
        <div className={styles.readout}>
          <div className={styles.readoutLabel}>▸ Phase State</div>
          <div className={styles.readoutCanvas}><canvas ref={phaseCanvasRef} /></div>
          <div className={styles.readoutValue}>TEMP: {formData.hallucinationIndex.toFixed(2)}</div>
        </div>
        <div className={styles.readout}>
          <div className={styles.readoutLabel}>▸ Superposition</div>
          <div className={styles.readoutCanvas}><canvas ref={superCanvasRef} /></div>
        </div>
        <div className={styles.readout}>
          <div className={styles.readoutLabel}>▸ Hallucination Index</div>
          <div className={styles.readoutCanvas}><canvas ref={hallucCanvasRef} /></div>
          <div className={styles.readoutValueAlert}>HIGH [{Math.round(formData.hallucinationIndex * 5)}/5]</div>
        </div>
      </div>

      {/* Center - transparent to show background media */}
      <div className={styles.center}>
        {/* Only show particle canvas if no media */}
        {!formData.mediaUrl && <canvas ref={centerCanvasRef} className={styles.centerCanvas} />}

        {/* Alignment Compass Overlay with glass effect */}
        <div className={styles.alignmentOverlay}>
          <div className={styles.alignmentLabel}>{allegianceLabels[formData.allegiance]}</div>
        </div>

        {/* Upload overlay (compact) with glass effect */}
        {onMediaAnalyzed && setIsAnalyzing && (
          <div className={styles.uploadOverlay}>
            <MediaUploadZone
              compact
              onMediaAnalyzed={onMediaAnalyzed}
              isAnalyzing={!!isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              existingMediaUrl={formData.mediaUrl}
              existingMimeType={formData.mediaMimeType}
              onClear={onClearMedia}
            />
          </div>
        )}

        {/* No image placeholder */}
        {!formData.mediaUrl && (
          <div className={styles.entityPlaceholder}>
            <div className={styles.placeholderBox}>◇</div>
            <span>[NO IMAGE]</span>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className={styles.rightCol}>
        <div className={styles.readout}>
          <div className={styles.readoutLabel}>▸ Latent Position</div>
          <div className={styles.readoutCanvas}><canvas ref={coordsCanvasRef} /></div>
          <div className={styles.readoutValueSmall}>
            X:{formData.coordinates.geometry.toFixed(3)} Y:{formData.coordinates.alterity.toFixed(3)}<br/>
            Z:{formData.coordinates.dynamics.toFixed(3)}
          </div>
        </div>
        <div className={styles.readout}>
          <div className={styles.readoutLabel}>▸ Manifold Curvature</div>
          <div className={styles.readoutCanvas}><canvas ref={manifoldCanvasRef} /></div>
          <div className={styles.readoutValueAlert}>{formData.manifoldCurvature.toUpperCase()}</div>
        </div>
        <div className={styles.readout}>
          <div className={styles.readoutLabel}>▸ Embedding Signature</div>
          <div className={styles.readoutCanvas}><canvas ref={spectralCanvasRef} /></div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.footerName} style={{ whiteSpace: 'pre-line' }}>{displayName}</div>
          <div className={styles.footerMeta}>
            <div className={styles.footerMetaLine}>CLASS <span>{formData.type.toUpperCase()}</span></div>
            <div className={styles.footerMetaLine}>
              THREAT <span style={{ color: threatColor }}>{formData.threatLevel.toUpperCase()}</span>
            </div>
            <div className={styles.footerCardinals}>
              <span style={{ color: '#CAA554' }}>◆</span> {Math.abs(formData.coordinates.geometry).toFixed(3)}
              <span style={{ marginLeft: '6px', color: '#ECE3D6' }}>○</span> {Math.abs(formData.coordinates.alterity).toFixed(3)}
              <span style={{ marginLeft: '6px', color: '#5B8A7A' }}>◇</span> {Math.abs(formData.coordinates.dynamics).toFixed(3)}
            </div>
          </div>
        </div>
        <div className={styles.footerRight}>
          <div className={styles.footerBio}>
            {formData.description || 'No description provided.'}
          </div>
        </div>
      </div>
    </div>
  );
}

