'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Denizen } from '@/lib/types';
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

export function DenizenModalV3({ denizen, onClose }: DenizenModalV3Props) {
  const { isAuthenticated } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Running timestamp
  useEffect(() => {
    if (!denizen) return;
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [denizen]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

      const { data: { publicUrl } } = supabase.storage
        .from('denizen-media')
        .getPublicUrl(fileName);

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
      window.location.reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (!denizen) return null;

  // Derived values
  const signalStrength = ((denizen.coordinates.geometry + 1) / 2).toFixed(3);
  const epoch = denizen.firstObserved || '4.2847';
  const tempValue = ((denizen.coordinates.dynamics + 1) / 2).toFixed(2);
  const hallucinationLevel = denizen.coordinates.dynamics > 0.5 ? 'HIGH' : denizen.coordinates.dynamics > 0 ? 'MODERATE' : 'LOW';
  const hallucinationScore = Math.round((denizen.coordinates.dynamics + 1) * 2.5);
  const severityLevel = denizen.threatLevel === 'Existential' ? 'CRITICAL' : denizen.threatLevel === 'Volatile' ? 'SEVERE' : denizen.threatLevel === 'Cautious' ? 'MODERATE' : 'NOMINAL';

  // Media
  const primaryMedia = denizen.media?.find(m => m.isPrimary) || denizen.media?.[0];
  const mediaUrl = primaryMedia?.storagePath || denizen.image;
  const isVideo = primaryMedia?.mediaType === 'video' || denizen.videoUrl;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{
        padding: '16px',
        background: 'rgba(5, 4, 3, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Card Container */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: '820px',
          background: '#0A0908',
          border: '1px solid rgba(202, 165, 84, 0.3)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center z-50 transition-all duration-150"
          style={{
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
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

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(202, 165, 84, 0.2)',
            background: 'rgba(5, 4, 3, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#CAA554',
              }}
            >
              ATLAS RESEARCH
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.4)' }}>
              MODE: <span style={{ color: 'rgba(236, 227, 214, 0.7)' }}>ACTIVE SCAN</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.4)' }}>
              SIG: <span style={{ color: '#CAA554' }}>{signalStrength}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.4)' }}>
              EPOCH: <span style={{ color: 'rgba(236, 227, 214, 0.7)' }}>{epoch}</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.5)' }}>
              [{formatTime(elapsedTime)}]
            </span>
          </div>
        </div>

        {/* Main Grid - 2 rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            borderBottom: '1px solid rgba(202, 165, 84, 0.2)',
          }}
        >
          {/* Row 1, Col 1: Phase State */}
          <div style={{ borderRight: '1px solid rgba(202, 165, 84, 0.15)', borderBottom: '1px solid rgba(202, 165, 84, 0.15)', padding: '16px' }}>
            <VisualizationPanel
              label="PHASE STATE"
              type="phase"
              value={denizen.coordinates.geometry}
              sublabel={`TEMP: ${tempValue}`}
              sublabelColor="#CAA554"
            />
          </div>

          {/* Row 1, Col 2: Center Top (Entity) */}
          <div
            style={{
              borderRight: '1px solid rgba(202, 165, 84, 0.15)',
              borderBottom: '1px solid rgba(202, 165, 84, 0.15)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Entity silhouette or image */}
            {mediaUrl ? (
              isVideo ? (
                <video
                  src={denizen.videoUrl || mediaUrl}
                  style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }}
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt={denizen.name}
                  width={120}
                  height={140}
                  style={{ objectFit: 'contain' }}
                />
              )
            ) : (
              <EntitySilhouette />
            )}
            {/* Allegiance label */}
            <span
              style={{
                marginTop: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.05em',
                color: '#CAA554',
              }}
            >
              ◎ {denizen.allegiance.toUpperCase()}
            </span>
          </div>

          {/* Row 1, Col 3: Latent Position */}
          <div style={{ borderBottom: '1px solid rgba(202, 165, 84, 0.15)', padding: '16px' }}>
            <VisualizationPanel
              label="LATENT POSITION"
              type="latent"
              value={denizen.coordinates.geometry}
              sublabel={`X:${denizen.coordinates.geometry.toFixed(3)} Y:${denizen.coordinates.alterity.toFixed(3)}`}
              sublabel2={`Z:${denizen.coordinates.dynamics.toFixed(3)}`}
            />
          </div>

          {/* Row 2, Col 1: Superposition + Hallucination */}
          <div style={{ borderRight: '1px solid rgba(202, 165, 84, 0.15)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <VisualizationPanel
              label="SUPERPOSITION"
              type="superposition"
              value={denizen.coordinates.alterity}
              small
            />
            <VisualizationPanel
              label="HALLUCINATION INDEX"
              type="hallucination"
              value={denizen.coordinates.dynamics}
              sublabel={`${hallucinationLevel} [${hallucinationScore}/5]`}
              sublabelColor={hallucinationLevel === 'HIGH' ? '#C17F59' : '#CAA554'}
              small
            />
          </div>

          {/* Row 2, Col 2: Center Bottom (Brackets + Upload) */}
          <div
            style={{
              borderRight: '1px solid rgba(202, 165, 84, 0.15)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Corner brackets */}
            <CornerBrackets />

            {/* Upload button */}
            {isAuthenticated && (
              <div style={{ position: 'absolute', bottom: '16px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  className="hidden"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    color: isUploading ? 'rgba(236, 227, 214, 0.3)' : 'rgba(236, 227, 214, 0.7)',
                    background: 'rgba(5, 4, 3, 0.9)',
                    border: '1px solid rgba(236, 227, 214, 0.15)',
                    cursor: isUploading ? 'default' : 'pointer',
                  }}
                >
                  {isUploading ? 'UPLOADING...' : '+ UPLOAD MEDIA'}
                </button>
                {uploadError && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '4px',
                      whiteSpace: 'nowrap',
                      padding: '4px 8px',
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

          {/* Row 2, Col 3: Manifold + Embedding */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <VisualizationPanel
              label="MANIFOLD CURVATURE"
              type="manifold"
              value={denizen.coordinates.alterity}
              sublabel={severityLevel}
              sublabelColor={severityLevel === 'SEVERE' || severityLevel === 'CRITICAL' ? '#C17F59' : '#5B8A7A'}
              small
            />
            <VisualizationPanel
              label="EMBEDDING SIGNATURE"
              type="embedding"
              value={denizen.coordinates.dynamics}
              small
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            padding: '20px',
            gap: '24px',
            background: 'rgba(5, 4, 3, 0.6)',
          }}
        >
          {/* Left: Identity */}
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '28px',
                color: '#CAA554',
                letterSpacing: '0.02em',
                marginBottom: '8px',
              }}
            >
              {denizen.name.toUpperCase()}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.5)' }}>
                CLASS <span style={{ color: '#ECE3D6' }}>{denizen.type.toUpperCase()}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.5)' }}>
                THREAT <span style={{ color: denizen.threatLevel === 'Volatile' || denizen.threatLevel === 'Existential' ? '#C17F59' : '#ECE3D6' }}>{denizen.threatLevel.toUpperCase()}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#CAA554' }}>
                ◆ {denizen.coordinates.geometry.toFixed(3)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ECE3D6' }}>
                ○ {denizen.coordinates.alterity.toFixed(3)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#5B8A7A' }}>
                ◇ {denizen.coordinates.dynamics.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Right: Description */}
          <div
            style={{
              paddingLeft: '24px',
              borderLeft: '1px solid rgba(202, 165, 84, 0.2)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'rgba(236, 227, 214, 0.7)',
              }}
            >
              {denizen.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VISUALIZATION PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

interface VisualizationPanelProps {
  label: string;
  type: 'phase' | 'superposition' | 'hallucination' | 'latent' | 'manifold' | 'embedding';
  value: number;
  sublabel?: string;
  sublabel2?: string;
  sublabelColor?: string;
  small?: boolean;
}

function VisualizationPanel({ label, type, value, sublabel, sublabel2, sublabelColor = 'rgba(236, 227, 214, 0.5)', small }: VisualizationPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.05em',
          color: 'rgba(236, 227, 214, 0.4)',
          marginBottom: '8px',
        }}
      >
        ▸ {label}
      </span>
      <div style={{ flex: 1, minHeight: small ? '60px' : '100px' }}>
        <ParticleCanvas type={type} value={value} small={small} />
      </div>
      {sublabel && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: sublabelColor,
            marginTop: '8px',
          }}
        >
          {sublabel}
        </span>
      )}
      {sublabel2 && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: sublabelColor,
            marginTop: '2px',
          }}
        >
          {sublabel2}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICLE CANVAS
   ═══════════════════════════════════════════════════════════════════════════ */

function ParticleCanvas({ type, value, small }: { type: string; value: number; small?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;

    const drawPixel = (x: number, y: number, color: typeof COLORS.GOLD, alpha = 1) => {
      const px = Math.floor(x / GRID) * GRID;
      const py = Math.floor(y / GRID) * GRID;
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
      ctx.fillRect(px, py, GRID, GRID);
    };

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const phase = phaseRef.current;
      const normalizedValue = (value + 1) / 2;

      switch (type) {
        case 'phase': {
          // Scattered dots moving in wave pattern
          for (let i = 0; i < 40; i++) {
            const baseX = (i % 10) * (width / 10) + 10;
            const baseY = Math.floor(i / 10) * (height / 4) + 20;
            const offsetX = Math.sin(phase + i * 0.3) * 15 * normalizedValue;
            const offsetY = Math.cos(phase + i * 0.5) * 10 * normalizedValue;
            drawPixel(baseX + offsetX, baseY + offsetY, COLORS.GOLD, 0.4 + Math.random() * 0.4);
          }
          break;
        }

        case 'superposition': {
          // Multiple wave lines
          for (let wave = 0; wave < 3; wave++) {
            const yOffset = (wave + 1) * (height / 4);
            for (let x = 0; x < width; x += GRID * 2) {
              const y = yOffset + Math.sin((x / width) * Math.PI * 4 + phase + wave) * 15 * normalizedValue;
              drawPixel(x, y, wave === 1 ? COLORS.GOLD : COLORS.DAWN, 0.3 + wave * 0.15);
            }
          }
          break;
        }

        case 'hallucination': {
          // Erratic horizontal lines
          for (let i = 0; i < 5; i++) {
            const y = 10 + i * (height / 5);
            const lineWidth = Math.random() * width * 0.8 * normalizedValue;
            const startX = Math.random() * (width - lineWidth);
            for (let x = startX; x < startX + lineWidth; x += GRID) {
              if (Math.random() > 0.3) {
                drawPixel(x, y + Math.random() * 4, Math.random() > 0.5 ? COLORS.VOLATILE : COLORS.GOLD, 0.4 + Math.random() * 0.4);
              }
            }
          }
          break;
        }

        case 'latent': {
          // Dot grid
          const cols = 8;
          const rows = 6;
          const spacingX = width / (cols + 1);
          const spacingY = height / (rows + 1);
          for (let gx = 0; gx < cols; gx++) {
            for (let gy = 0; gy < rows; gy++) {
              const x = spacingX * (gx + 1);
              const y = spacingY * (gy + 1);
              const brightness = Math.sin(phase + gx * 0.3 + gy * 0.5) * 0.3 + 0.5;
              drawPixel(x, y, COLORS.DAWN, brightness * normalizedValue);
            }
          }
          break;
        }

        case 'manifold': {
          // Dot grid with wave distortion
          const cols = 10;
          const rows = 4;
          const spacingX = width / (cols + 1);
          const spacingY = height / (rows + 1);
          for (let gx = 0; gx < cols; gx++) {
            for (let gy = 0; gy < rows; gy++) {
              const baseX = spacingX * (gx + 1);
              const baseY = spacingY * (gy + 1);
              const wave = Math.sin(phase + gx * 0.4) * 5 * normalizedValue;
              drawPixel(baseX, baseY + wave, COLORS.DAWN, 0.4 + Math.random() * 0.3);
            }
          }
          break;
        }

        case 'embedding': {
          // Vertical bars
          const barCount = 16;
          const barWidth = GRID;
          const spacing = width / (barCount + 1);
          for (let i = 0; i < barCount; i++) {
            const x = spacing * (i + 1);
            const barHeight = Math.abs(Math.sin(phase * 0.5 + i * 0.6)) * height * 0.7 * normalizedValue + 5;
            const startY = height - barHeight - 5;
            for (let y = startY; y < height - 5; y += GRID) {
              const color = i % 4 === 0 ? COLORS.GOLD : i % 4 === 2 ? COLORS.DYNAMICS : COLORS.DAWN;
              drawPixel(x, y, color, 0.5 + Math.random() * 0.3);
            }
          }
          break;
        }
      }

      phaseRef.current += 0.015;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [type, value, small]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CORNER BRACKETS
   ═══════════════════════════════════════════════════════════════════════════ */

function CornerBrackets() {
  const bracketStyle = {
    position: 'absolute' as const,
    width: '24px',
    height: '24px',
    borderColor: 'rgba(236, 227, 214, 0.3)',
    borderStyle: 'solid' as const,
    borderWidth: '0',
  };

  return (
    <>
      <div style={{ ...bracketStyle, top: '20px', left: '20px', borderTopWidth: '1px', borderLeftWidth: '1px' }} />
      <div style={{ ...bracketStyle, top: '20px', right: '20px', borderTopWidth: '1px', borderRightWidth: '1px' }} />
      <div style={{ ...bracketStyle, bottom: '20px', left: '20px', borderBottomWidth: '1px', borderLeftWidth: '1px' }} />
      <div style={{ ...bracketStyle, bottom: '20px', right: '20px', borderBottomWidth: '1px', borderRightWidth: '1px' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ENTITY SILHOUETTE
   ═══════════════════════════════════════════════════════════════════════════ */

function EntitySilhouette() {
  return (
    <div
      style={{
        width: '80px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 60 80" style={{ width: '100%', height: '100%' }}>
        {/* Simple abstract entity shape made of dots */}
        <g fill="rgba(236, 227, 214, 0.4)">
          {/* Head */}
          <circle cx="30" cy="15" r="2" />
          <circle cx="26" cy="12" r="1.5" />
          <circle cx="34" cy="12" r="1.5" />
          <circle cx="30" cy="10" r="1.5" />
          {/* Body */}
          <circle cx="30" cy="25" r="2" />
          <circle cx="25" cy="28" r="1.5" />
          <circle cx="35" cy="28" r="1.5" />
          <circle cx="30" cy="35" r="2" />
          <circle cx="27" cy="40" r="1.5" />
          <circle cx="33" cy="40" r="1.5" />
          <circle cx="30" cy="45" r="2" />
          <circle cx="30" cy="55" r="2" />
          {/* Arms */}
          <circle cx="20" cy="30" r="1.5" />
          <circle cx="15" cy="32" r="1.5" />
          <circle cx="40" cy="30" r="1.5" />
          <circle cx="45" cy="32" r="1.5" />
          {/* Legs */}
          <circle cx="25" cy="65" r="1.5" />
          <circle cx="22" cy="72" r="1.5" />
          <circle cx="35" cy="65" r="1.5" />
          <circle cx="38" cy="72" r="1.5" />
        </g>
      </svg>
    </div>
  );
}
