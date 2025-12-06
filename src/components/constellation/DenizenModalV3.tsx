'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Denizen, MediaType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import Image from 'next/image';

type DenizenMediaInsert = Database['public']['Tables']['denizen_media']['Insert'];

interface DenizenModalV3Props {
  denizen: Denizen | null;
  onClose: () => void;
  onNavigate?: (denizenId: string) => void;
  allDenizens?: Denizen[];
}

// Color constants for particle visualizations
const COLORS = {
  GOLD: { r: 202, g: 165, b: 84 },
  DAWN: { r: 236, g: 227, b: 214 },
  DYNAMICS: { r: 91, g: 138, b: 122 },
  VOLATILE: { r: 193, g: 127, b: 89 },
};

// Grid size for pixelated rendering
const GRID = 3;

/**
 * DenizenModalV3 — Research Station Card Interface
 *
 * Full-screen card with:
 * - Media layer behind HUD elements
 * - 6 particle canvas visualizations
 * - Alignment compass and particle field
 * - Authentication for media uploads
 */
export function DenizenModalV3({ denizen, onClose, onNavigate, allDenizens = [] }: DenizenModalV3Props) {
  const { isAuthenticated } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Handle media upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !denizen || !e.target.files?.length) return;

    setIsUploading(true);
    setUploadError(null);

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${denizen.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('denizen-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('denizen-media')
        .getPublicUrl(fileName);

      // Insert into denizen_media table
      const mediaInsert: DenizenMediaInsert = {
        denizen_id: denizen.id,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        storage_path: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: 0,
        is_primary: !denizen.media?.length,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any).from('denizen_media').insert(mediaInsert);

      if (dbError) throw dbError;

      // Reload page to show new media
      window.location.reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Get threat score (1-4)
  const getThreatScore = (level: string): number => {
    const scores: Record<string, number> = {
      'Benign': 1,
      'Cautious': 2,
      'Volatile': 3,
      'Existential': 4
    };
    return scores[level] || 1;
  };

  if (!denizen) return null;

  // Build media from denizen data
  const primaryMedia = denizen.media?.find(m => m.isPrimary) || denizen.media?.[0];
  const mediaUrl = primaryMedia?.storagePath || denizen.image;
  const isVideo = primaryMedia?.mediaType === 'video' || denizen.videoUrl;

  // Derived values
  const signalStrength = ((denizen.coordinates.geometry + 1) / 2).toFixed(3);
  const epoch = denizen.firstObserved || '4.2847';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{
        background: 'rgba(5, 4, 3, 0.95)',
        backdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .rotate-slow { animation: rotateSlow 60s linear infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Card Container - 4:5 aspect ratio */}
      <div
        className="relative w-full max-w-[900px] overflow-hidden"
        style={{
          aspectRatio: '4/5',
          maxHeight: '90vh',
          background: '#0A0908',
          border: '1px solid rgba(236, 227, 214, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center z-50 transition-all duration-150"
          style={{
            background: 'rgba(5, 4, 3, 0.8)',
            border: '1px solid rgba(236, 227, 214, 0.15)',
            color: 'rgba(236, 227, 214, 0.5)',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.3)';
            e.currentTarget.style.color = '#ECE3D6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
            e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)';
          }}
        >
          x
        </button>

        {/* ═══════════════════════════════════════════════════════════════
            MEDIA LAYER (Behind everything)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0 z-0">
          {mediaUrl ? (
            isVideo ? (
              <video
                src={denizen.videoUrl || mediaUrl}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.6 }}
                autoPlay
                loop
                muted
              />
            ) : (
              <Image
                src={mediaUrl}
                alt={denizen.name}
                fill
                className="object-cover"
                style={{ opacity: 0.6 }}
              />
            )
          ) : (
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #141210 0%, #050403 100%)' }} />
          )}
          {/* Darken overlay for readability */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,4,3,0.4) 0%, rgba(5,4,3,0.7) 50%, rgba(5,4,3,0.9) 100%)' }} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            HUD GRID LAYOUT
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 z-10 grid"
          style={{
            gridTemplateColumns: '150px 1fr 150px',
            gridTemplateRows: 'auto 1fr auto',
          }}
        >
          {/* ─────────────────────────────────────────────────────────────
              HEADER
              ───────────────────────────────────────────────────────────── */}
          <div
            className="col-span-3 flex justify-between items-center"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(236, 227, 214, 0.1)',
              background: 'rgba(5, 4, 3, 0.8)',
            }}
          >
            <div className="flex items-center gap-4">
              <span
                className="tracking-[0.1em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#CAA554' }}
              >
                Atlas Research
              </span>
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(236, 227, 214, 0.4)' }}
              >
                MODE: <span style={{ color: 'rgba(236, 227, 214, 0.7)' }}>ACTIVE SCAN</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(236, 227, 214, 0.4)' }}
              >
                SIG: <span style={{ color: '#CAA554' }}>{signalStrength}</span>
              </span>
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(236, 227, 214, 0.4)' }}
              >
                EPOCH: <span style={{ color: 'rgba(236, 227, 214, 0.7)' }}>{epoch}</span>
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN - Particle Visualizations
              ───────────────────────────────────────────────────────────── */}
          <div
            className="flex flex-col gap-4"
            style={{
              padding: '16px',
              background: 'rgba(5, 4, 3, 0.6)',
              borderRight: '1px solid rgba(236, 227, 214, 0.08)',
            }}
          >
            <ParticleReadout
              label="Phase State"
              type="phase"
              value={denizen.coordinates.geometry}
            />
            <ParticleReadout
              label="Superposition"
              type="superposition"
              value={denizen.coordinates.alterity}
            />
            <ParticleReadout
              label="Hallucination Idx"
              type="hallucination"
              value={denizen.coordinates.dynamics}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CENTER - Entity Display
              ───────────────────────────────────────────────────────────── */}
          <div className="relative flex items-center justify-center">
            {/* Particle Field Background */}
            <ParticleField />

            {/* Alignment Compass */}
            <AlignmentCompass coordinates={denizen.coordinates} />

            {/* Upload button for authenticated users */}
            {isAuthenticated && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 transition-all duration-150"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    color: isUploading ? 'rgba(236, 227, 214, 0.3)' : 'rgba(236, 227, 214, 0.7)',
                    background: 'rgba(5, 4, 3, 0.9)',
                    border: '1px solid rgba(236, 227, 214, 0.15)',
                  }}
                >
                  {isUploading ? 'UPLOADING...' : '+ UPLOAD MEDIA'}
                </button>
                {uploadError && (
                  <div
                    className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#C17F59',
                      background: 'rgba(5, 4, 3, 0.9)',
                    }}
                  >
                    {uploadError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN - Particle Visualizations
              ───────────────────────────────────────────────────────────── */}
          <div
            className="flex flex-col gap-4"
            style={{
              padding: '16px',
              background: 'rgba(5, 4, 3, 0.6)',
              borderLeft: '1px solid rgba(236, 227, 214, 0.08)',
            }}
          >
            <ParticleReadout
              label="Latent Position"
              type="latent"
              value={denizen.coordinates.geometry}
            />
            <ParticleReadout
              label="Manifold Curve"
              type="manifold"
              value={denizen.coordinates.alterity}
            />
            <ParticleReadout
              label="Embed Signature"
              type="embedding"
              value={denizen.coordinates.dynamics}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              FOOTER
              ───────────────────────────────────────────────────────────── */}
          <div
            className="col-span-3 flex flex-col"
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(236, 227, 214, 0.1)',
              background: 'rgba(5, 4, 3, 0.9)',
            }}
          >
            {/* Entity Name & Classification */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1
                  className="mb-1"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: '#ECE3D6', letterSpacing: '0.02em' }}
                >
                  {denizen.name}
                </h1>
                {denizen.subtitle && (
                  <span
                    className="italic"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(236, 227, 214, 0.5)' }}
                  >
                    &quot;{denizen.subtitle}&quot;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6">
                {/* Class */}
                <div className="flex flex-col items-end">
                  <span
                    className="tracking-[0.05em] uppercase"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
                  >
                    Class
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ECE3D6' }}>
                    {denizen.type}
                  </span>
                </div>
                {/* Threat */}
                <div className="flex flex-col items-end">
                  <span
                    className="tracking-[0.05em] uppercase"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
                  >
                    Threat
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5"
                          style={{ background: i <= getThreatScore(denizen.threatLevel) ? '#C17F59' : 'rgba(236, 227, 214, 0.15)' }}
                        />
                      ))}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ECE3D6' }}>
                      {denizen.threatLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cardinals & Description */}
            <div className="flex gap-6">
              {/* Cardinal Coordinates */}
              <div className="flex gap-4">
                <CardinalValue glyph="◆" label="GEO" value={denizen.coordinates.geometry} color="#CAA554" />
                <CardinalValue glyph="○" label="ALT" value={denizen.coordinates.alterity} color="#ECE3D6" />
                <CardinalValue glyph="◇" label="DYN" value={denizen.coordinates.dynamics} color="#5B8A7A" />
              </div>

              {/* Description */}
              <div className="flex-1 pl-6" style={{ borderLeft: '1px solid rgba(236, 227, 214, 0.08)' }}>
                <p
                  className="line-clamp-3"
                  style={{ fontSize: '12px', lineHeight: 1.6, color: 'rgba(236, 227, 214, 0.6)' }}
                >
                  {denizen.description}
                </p>
              </div>
            </div>

            {/* Connections */}
            {denizen.connections && denizen.connections.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(236, 227, 214, 0.06)' }}>
                <span
                  className="tracking-[0.05em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
                >
                  Links:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {denizen.connections.slice(0, 4).map((connId) => {
                    const connected = allDenizens.find(d => d.id === connId);
                    if (!connected) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => onNavigate?.(connId)}
                        className="px-2 py-0.5 transition-all duration-150"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'rgba(236, 227, 214, 0.6)',
                          background: 'rgba(236, 227, 214, 0.04)',
                          border: '1px solid rgba(236, 227, 214, 0.08)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.2)';
                          e.currentTarget.style.color = '#ECE3D6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.08)';
                          e.currentTarget.style.color = 'rgba(236, 227, 214, 0.6)';
                        }}
                      >
                        {connected.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICLE VISUALIZATION COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

type ReadoutType = 'phase' | 'superposition' | 'hallucination' | 'latent' | 'manifold' | 'embedding';

function ParticleReadout({ label, type, value }: { label: string; type: ReadoutType; value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 118;
    const height = 80;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;

    // Helper: draw a pixel-snapped point
    const drawPixel = (x: number, y: number, color: typeof COLORS.GOLD, alpha = 1) => {
      const px = Math.floor(x / GRID) * GRID;
      const py = Math.floor(y / GRID) * GRID;
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
      ctx.fillRect(px, py, GRID, GRID);
    };

    // Helper: draw a particle line
    const drawParticleLine = (x1: number, y1: number, x2: number, y2: number, color: typeof COLORS.GOLD, density = 0.5) => {
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const steps = Math.floor(dist / GRID);
      for (let i = 0; i < steps; i++) {
        if (Math.random() > density) continue;
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        drawPixel(x, y, color, 0.3 + Math.random() * 0.4);
      }
    };

    // Helper: draw a particle circle
    const drawParticleCircle = (cx: number, cy: number, r: number, color: typeof COLORS.GOLD, density = 0.4) => {
      const circumference = 2 * Math.PI * r;
      const steps = Math.floor(circumference / GRID);
      for (let i = 0; i < steps; i++) {
        if (Math.random() > density) continue;
        const angle = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        drawPixel(x, y, color, 0.3 + Math.random() * 0.5);
      }
    };

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const phase = phaseRef.current;
      const normalizedValue = (value + 1) / 2; // Convert -1 to 1 range to 0 to 1

      switch (type) {
        case 'phase': {
          // Oscillating wave with particles
          const centerY = height / 2;
          for (let x = 0; x < width; x += GRID) {
            const wave = Math.sin((x / width) * Math.PI * 4 + phase) * 20 * normalizedValue;
            const y = centerY + wave;
            drawPixel(x, y, COLORS.GOLD, 0.5 + Math.random() * 0.3);
          }
          // Scattered particles
          for (let i = 0; i < 8; i++) {
            const x = Math.random() * width;
            const y = centerY + (Math.random() - 0.5) * 40;
            drawPixel(x, y, COLORS.DAWN, 0.2);
          }
          break;
        }

        case 'superposition': {
          // Multiple overlapping circles
          const cx = width / 2;
          const cy = height / 2;
          for (let i = 0; i < 3; i++) {
            const offset = Math.sin(phase + i * Math.PI * 0.6) * 15 * normalizedValue;
            drawParticleCircle(cx + offset, cy, 20 + i * 8, i === 0 ? COLORS.GOLD : COLORS.DAWN, 0.3);
          }
          break;
        }

        case 'hallucination': {
          // Erratic scatter pattern
          const intensity = 0.3 + normalizedValue * 0.5;
          for (let i = 0; i < 25; i++) {
            const x = width / 2 + (Math.random() - 0.5) * width * 0.8;
            const y = height / 2 + (Math.random() - 0.5) * height * 0.8;
            const flicker = Math.sin(phase * 3 + i) > 0;
            if (flicker) {
              drawPixel(x, y, Math.random() > 0.5 ? COLORS.VOLATILE : COLORS.GOLD, intensity);
            }
          }
          break;
        }

        case 'latent': {
          // Grid of points with wave distortion
          for (let gx = 0; gx < 6; gx++) {
            for (let gy = 0; gy < 4; gy++) {
              const baseX = 15 + gx * 18;
              const baseY = 15 + gy * 18;
              const distort = Math.sin(phase + gx * 0.5 + gy * 0.3) * 4 * normalizedValue;
              drawPixel(baseX + distort, baseY, COLORS.GOLD, 0.4 + normalizedValue * 0.3);
            }
          }
          break;
        }

        case 'manifold': {
          // Curved lines representing topology
          const cx = width / 2;
          const cy = height / 2;
          for (let curve = 0; curve < 3; curve++) {
            const baseRadius = 15 + curve * 12;
            const deform = Math.sin(phase + curve) * 8 * normalizedValue;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
              const r = baseRadius + Math.sin(angle * 3 + phase) * deform;
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              drawPixel(x, y, curve === 1 ? COLORS.DYNAMICS : COLORS.DAWN, 0.3 + curve * 0.15);
            }
          }
          break;
        }

        case 'embedding': {
          // Vertical bars representing vector dimensions
          const barCount = 12;
          const barWidth = GRID;
          const spacing = (width - barCount * barWidth) / (barCount + 1);
          for (let i = 0; i < barCount; i++) {
            const x = spacing + i * (barWidth + spacing);
            const barHeight = Math.abs(Math.sin(phase * 0.5 + i * 0.8)) * height * 0.6 * normalizedValue;
            const startY = height - 10 - barHeight;
            for (let y = startY; y < height - 10; y += GRID) {
              drawPixel(x, y, i % 3 === 0 ? COLORS.GOLD : COLORS.DAWN, 0.4 + Math.random() * 0.3);
            }
          }
          break;
        }
      }

      phaseRef.current += 0.02;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [type, value]);

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="tracking-[0.05em] uppercase"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.4)' }}
      >
        {label}
      </span>
      <div
        style={{
          background: 'rgba(5, 4, 3, 0.6)',
          border: '1px solid rgba(236, 227, 214, 0.08)',
        }}
      >
        <canvas ref={canvasRef} style={{ width: 118, height: 80, display: 'block' }} />
      </div>
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize particles
    const particles = particlesRef.current;
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: Math.random(),
      });
    }

    let animationId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.005;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw pixel-snapped
        const px = Math.floor(p.x / GRID) * GRID;
        const py = Math.floor(p.y / GRID) * GRID;
        const alpha = 0.2 + Math.sin(p.life * Math.PI * 2) * 0.15;

        ctx.fillStyle = `rgba(${COLORS.DAWN.r},${COLORS.DAWN.g},${COLORS.DAWN.b},${alpha})`;
        ctx.fillRect(px, py, GRID, GRID);
      });

      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}

function AlignmentCompass({ coordinates }: { coordinates: { geometry: number; alterity: number; dynamics: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const rotation = rotationRef.current;

      // Outer ring (dashed, rotating)
      ctx.strokeStyle = 'rgba(236, 227, 214, 0.15)';
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Middle ring
      ctx.strokeStyle = 'rgba(236, 227, 214, 0.1)';
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = 'rgba(236, 227, 214, 0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = 'rgba(236, 227, 214, 0.1)';
      ctx.beginPath();
      ctx.moveTo(cx - 95, cy);
      ctx.lineTo(cx + 95, cy);
      ctx.moveTo(cx, cy - 95);
      ctx.lineTo(cx, cy + 95);
      ctx.stroke();

      // Cardinal markers (rotating)
      const markerRadius = 80;
      const cardinalColors = [
        { color: COLORS.GOLD, value: coordinates.geometry, label: 'G' },
        { color: COLORS.DAWN, value: coordinates.alterity, label: 'A' },
        { color: COLORS.DYNAMICS, value: coordinates.dynamics, label: 'D' },
      ];

      cardinalColors.forEach((cardinal, i) => {
        const angle = rotation + (i * Math.PI * 2) / 3;
        const dist = markerRadius * (0.5 + (cardinal.value + 1) / 4);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        // Draw marker
        const px = Math.floor(x / GRID) * GRID;
        const py = Math.floor(y / GRID) * GRID;
        ctx.fillStyle = `rgba(${cardinal.color.r},${cardinal.color.g},${cardinal.color.b},0.8)`;
        ctx.fillRect(px - GRID, py - GRID, GRID * 3, GRID * 3);
      });

      // Center point
      ctx.fillStyle = 'rgba(236, 227, 214, 0.5)';
      ctx.fillRect(cx - GRID / 2, cy - GRID / 2, GRID, GRID);

      rotationRef.current += 0.003;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [coordinates]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ width: 200, height: 200 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function CardinalValue({ glyph, label, value, color }: { glyph: string; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color, fontSize: '14px' }}>{glyph}</span>
      <div className="flex flex-col">
        <span
          className="tracking-[0.05em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'rgba(236, 227, 214, 0.3)' }}
        >
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.7)' }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
