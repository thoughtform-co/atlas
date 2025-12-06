'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Denizen } from '@/lib/types';
import Image from 'next/image';

interface DenizenModalV3Props {
  denizen: Denizen | null;
  onClose: () => void;
  onNavigate?: (denizenId: string) => void;
  allDenizens?: Denizen[];
}

/**
 * DenizenModalV3 — Xenobiologist Research Interface
 *
 * Layout inspired by alien research station aesthetics:
 * - Left: Media viewer with holographic HUD overlays
 * - Right: Retrofuturistic xenobiologist log
 * - Bottom: Data visualization panels
 *
 * HUD elements are semi-transparent glass overlays
 * that can be linked to database values.
 */
export function DenizenModalV3({ denizen, onClose, onNavigate, allDenizens = [] }: DenizenModalV3Props) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Draw HUD rings overlay
  useEffect(() => {
    if (!denizen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw concentric rings
    const ringCount = 4;
    const maxRadius = Math.min(centerX, centerY) * 0.9;

    for (let i = 1; i <= ringCount; i++) {
      const radius = (maxRadius / ringCount) * i;
      const alpha = 0.15 - (i * 0.02);

      ctx.strokeStyle = `rgba(202, 165, 84, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Add tick marks on outer rings
      if (i >= 3) {
        const tickCount = 36;
        for (let t = 0; t < tickCount; t++) {
          const angle = (t / tickCount) * Math.PI * 2;
          const innerR = radius - 4;
          const outerR = radius;

          ctx.strokeStyle = `rgba(202, 165, 84, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
          ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
          ctx.stroke();
        }
      }
    }

    // Draw crosshair
    ctx.strokeStyle = 'rgba(202, 165, 84, 0.2)';
    ctx.lineWidth = 1;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius * 0.3);
    ctx.lineTo(centerX, centerY + maxRadius * 0.3);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius * 0.3, centerY);
    ctx.lineTo(centerX + maxRadius * 0.3, centerY);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(202, 165, 84, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

  }, [denizen]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Get connected denizen
  const getConnectedDenizen = (id: string): Denizen | undefined => {
    return allDenizens.find((d) => d.id === id);
  };

  if (!denizen) return null;

  // Build media array from denizen data
  // Uses actual media from database, or falls back to primary image
  const mediaItems: Array<{ id: string; url: string; mediaType: 'image' | 'video' | 'thumbnail' }> = denizen.media?.length
    ? denizen.media.map(m => ({ id: m.id, url: m.storagePath, mediaType: m.mediaType }))
    : denizen.image
      ? [{ id: '1', url: denizen.image, mediaType: 'image' as const }]
      : [];

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
      <div
        className="modal-v3 relative w-full max-w-[1400px] h-[90vh] max-h-[900px] grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden"
        style={{
          background: 'var(--void)',
          border: '1px solid var(--dawn-08)',
          animation: 'slideIn 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            LEFT SIDE — Media Viewer with HUD Overlays
            ═══════════════════════════════════════════════════════════════ */}
        <div className="relative flex">
          {/* Thumbnail Strip */}
          <div
            className="w-[80px] flex flex-col gap-2 p-2 border-r overflow-y-auto"
            style={{
              background: 'rgba(5, 4, 3, 0.8)',
              borderColor: 'var(--dawn-08)',
              scrollbarWidth: 'none',
            }}
          >
            {mediaItems.map((media, index) => (
              <button
                key={media.id || index}
                onClick={() => setSelectedMediaIndex(index)}
                className="relative aspect-square overflow-hidden transition-all duration-200"
                style={{
                  border: selectedMediaIndex === index
                    ? '1px solid var(--gold)'
                    : '1px solid var(--dawn-08)',
                  opacity: selectedMediaIndex === index ? 1 : 0.5,
                }}
              >
                {media.mediaType === 'image' && media.url ? (
                  <Image src={media.url} alt="" fill className="object-cover" />
                ) : media.mediaType === 'video' ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--surface-1)', color: 'var(--dawn-30)' }}
                  >
                    ▶
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--surface-1)', color: 'var(--dawn-15)' }}
                  >
                    {index + 1}
                  </div>
                )}
              </button>
            ))}

            {/* Placeholder slots */}
            {Array.from({ length: Math.max(0, 6 - mediaItems.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="aspect-square"
                style={{
                  border: '1px dashed var(--dawn-08)',
                  background: 'var(--dawn-04)',
                }}
              />
            ))}
          </div>

          {/* Main Media Display */}
          <div className="flex-1 flex flex-col">
            {/* Header Bar */}
            <div
              className="hud-glass flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: 'var(--dawn-08)' }}
            >
              <div className="flex items-center gap-4">
                <span className="hud-label">META SACREM GEOMETRY</span>
                <span className="hud-value">REST: {denizen.coordinates.geometry.toFixed(3)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hud-value">READ: {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center border text-[var(--dawn-30)] hover:text-[var(--dawn)] hover:border-[var(--dawn-30)] transition-all"
                  style={{ borderColor: 'var(--dawn-08)', fontFamily: 'var(--font-mono)' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Media Viewport */}
            <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--void)' }}>
              {/* Main Image/Video */}
              {mediaItems[selectedMediaIndex]?.url ? (
                mediaItems[selectedMediaIndex]?.mediaType === 'video' ? (
                  <video
                    src={mediaItems[selectedMediaIndex].url}
                    className="absolute inset-0 w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <Image
                    src={mediaItems[selectedMediaIndex].url}
                    alt={denizen.name}
                    fill
                    className="object-contain"
                  />
                )
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12rem',
                    color: 'var(--dawn-04)',
                  }}
                >
                  {denizen.glyphs[0]}
                </div>
              )}

              {/* HUD Overlay Canvas */}
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: 0.6 }}
              />

              {/* Corner HUD Elements */}
              <HudCorner position="top-left">
                <div className="hud-label">SPECIMEN</div>
                <div className="hud-value text-lg">{denizen.name.toUpperCase()}</div>
                <div className="hud-sublabel">{denizen.type}</div>
              </HudCorner>

              <HudCorner position="top-right">
                <div className="hud-label">THREAT ASSESSMENT</div>
                <ThreatIndicator level={denizen.threatLevel} />
              </HudCorner>

              <HudCorner position="bottom-left">
                <div className="hud-label">CARDINAL POSITION</div>
                <div className="flex gap-4 mt-1">
                  <CoordDisplay symbol="◆" label="GEO" value={denizen.coordinates.geometry} color="var(--gold)" />
                  <CoordDisplay symbol="○" label="ALT" value={denizen.coordinates.alterity} color="var(--dawn-50)" />
                  <CoordDisplay symbol="◇" label="DYN" value={denizen.coordinates.dynamics} color="var(--cardinal-dynamics)" />
                </div>
              </HudCorner>

              <HudCorner position="bottom-right">
                <div className="hud-label">GLYPHS</div>
                <div className="hud-value text-2xl tracking-[0.3em]">{denizen.glyphs}</div>
              </HudCorner>

              {/* Scanline Effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                }}
              />
            </div>

            {/* Bottom Data Panels */}
            <div
              className="grid grid-cols-3 border-t"
              style={{ borderColor: 'var(--dawn-08)', height: '140px' }}
            >
              {/* Waveform Panel */}
              <div className="hud-glass border-r p-3" style={{ borderColor: 'var(--dawn-08)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="hud-label">WAVEFORM</span>
                  <span className="hud-sublabel">54.03 GHz</span>
                </div>
                <WaveformDisplay seed={denizen.coordinates.geometry} />
              </div>

              {/* Data Panel */}
              <div className="hud-glass border-r p-3" style={{ borderColor: 'var(--dawn-08)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="hud-label">DATA</span>
                  <span className="hud-sublabel">100-400Hz</span>
                </div>
                <DataChart seed={denizen.coordinates.alterity} />
              </div>

              {/* Cognitive Depth Panel */}
              <div className="hud-glass p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="hud-label">COGNITIVE DEPTH</span>
                  <span className="hud-sublabel">54.F6.YM02</span>
                </div>
                <CognitiveDepthDisplay coordinates={denizen.coordinates} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT SIDE — Xenobiologist Log
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col border-l overflow-hidden"
          style={{
            borderColor: 'var(--dawn-08)',
            background: 'linear-gradient(180deg, var(--surface-0) 0%, var(--void) 100%)',
          }}
        >
          {/* Log Header */}
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--dawn-08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[var(--threat-benign)] animate-pulse" />
              <span className="hud-label">XENOBIOLOGY RESEARCH LOG</span>
            </div>
            <div
              className="text-xl tracking-wide"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--dawn)' }}
            >
              {denizen.name}
            </div>
            {denizen.subtitle && (
              <div
                className="mt-1 italic"
                style={{ fontFamily: 'var(--font-sans)', color: 'var(--dawn-50)', fontSize: '14px' }}
              >
                &quot;{denizen.subtitle}&quot;
              </div>
            )}
          </div>

          {/* Log Content */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--dawn-15) var(--dawn-04)',
            }}
          >
            {/* Classification Block */}
            <LogSection title="CLASSIFICATION" timestamp="EPOCH.4.2847">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <LogField label="Species Type" value={denizen.type} />
                <LogField label="Threat Level" value={denizen.threatLevel} />
                <LogField label="Domain" value={denizen.domain} />
                <LogField label="Allegiance" value={denizen.allegiance} />
              </div>
            </LogSection>

            {/* Description Block */}
            <LogSection title="PRIMARY OBSERVATION" timestamp="UPDATED">
              <p className="log-text">{denizen.description}</p>
            </LogSection>

            {/* Lore Block */}
            {denizen.lore && (
              <LogSection title="HISTORICAL RECORD" timestamp="ARCHIVAL">
                <div
                  className="relative pl-4"
                  style={{ borderLeft: '2px solid var(--gold-dim)' }}
                >
                  <p className="log-text italic" style={{ color: 'var(--dawn-50)' }}>
                    {denizen.lore}
                  </p>
                </div>
              </LogSection>
            )}

            {/* Capabilities Block */}
            {denizen.features && denizen.features.length > 0 && (
              <LogSection title="OBSERVED CAPABILITIES" timestamp="VERIFIED">
                <ul className="space-y-1">
                  {denizen.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--gold)', fontSize: '10px' }}>▸</span>
                      <span className="log-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </LogSection>
            )}

            {/* Connections Block */}
            {denizen.connections && denizen.connections.length > 0 && (
              <LogSection title="KNOWN ASSOCIATIONS" timestamp="MAPPED">
                <div className="flex flex-wrap gap-2">
                  {denizen.connections.map((connId) => {
                    const connected = getConnectedDenizen(connId);
                    if (!connected) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => onNavigate?.(connId)}
                        className="px-3 py-1.5 border transition-all hover:border-[var(--gold)] hover:text-[var(--gold)]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.05em',
                          color: 'var(--dawn-50)',
                          borderColor: 'var(--dawn-15)',
                          background: 'var(--dawn-04)',
                        }}
                      >
                        ↗ {connected.name.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </LogSection>
            )}

            {/* Researcher Notes */}
            <LogSection title="RESEARCHER NOTES" timestamp="PENDING">
              <div
                className="p-3 border border-dashed"
                style={{ borderColor: 'var(--dawn-08)', background: 'var(--dawn-04)' }}
              >
                <p className="log-text italic" style={{ color: 'var(--dawn-30)' }}>
                  [Awaiting field observations. Entity requires further study.]
                </p>
              </div>
            </LogSection>
          </div>

          {/* Log Footer */}
          <div
            className="px-6 py-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--dawn-08)', background: 'var(--surface-0)' }}
          >
            <div className="hud-sublabel">ID: {denizen.id.toUpperCase()}</div>
            <div className="hud-sublabel">ATLAS RESEARCH DIVISION</div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .hud-glass {
          background: rgba(5, 4, 3, 0.6);
          backdrop-filter: blur(8px);
        }

        .hud-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--dawn-30);
        }

        .hud-value {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.05em;
          color: var(--dawn);
        }

        .hud-sublabel {
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 0.1em;
          color: var(--dawn-30);
        }

        .log-text {
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.7;
          color: var(--dawn-70);
        }

        .modal-v3::-webkit-scrollbar {
          width: 4px;
        }

        .modal-v3::-webkit-scrollbar-track {
          background: var(--dawn-04);
        }

        .modal-v3::-webkit-scrollbar-thumb {
          background: var(--dawn-15);
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function HudCorner({
  position,
  children
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  children: React.ReactNode;
}) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4 text-right',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4 text-right',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} hud-glass px-3 py-2 pointer-events-none`}
      style={{ border: '1px solid var(--dawn-08)' }}
    >
      {children}
    </div>
  );
}

function ThreatIndicator({ level }: { level: string }) {
  const levels = ['Benign', 'Cautious', 'Volatile', 'Existential'];
  const currentIndex = levels.indexOf(level);
  const colors = ['var(--threat-benign)', 'var(--threat-cautious)', 'var(--threat-volatile)', 'var(--threat-existential)'];

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <div
            key={l}
            className="w-8 h-2"
            style={{
              background: i <= currentIndex ? colors[i] : 'var(--dawn-08)',
              opacity: i <= currentIndex ? 1 : 0.3,
            }}
          />
        ))}
      </div>
      <div className="hud-value" style={{ color: colors[currentIndex] }}>
        {level.toUpperCase()}
      </div>
    </div>
  );
}

function CoordDisplay({ symbol, label, value, color }: { symbol: string; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span style={{ color, fontSize: '14px' }}>{symbol}</span>
      <span className="hud-sublabel">{label}</span>
      <span className="hud-value" style={{ fontSize: '10px' }}>
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  );
}

function WaveformDisplay({ seed }: { seed: number }) {
  const points: string[] = [];
  const width = 200;
  const height = 60;

  for (let x = 0; x < width; x++) {
    const t = x / width;
    const noise = Math.sin(t * 50 + seed * 10) * Math.sin(t * 23) * Math.cos(t * 7);
    const y = height / 2 + noise * 20;
    points.push(`${x},${y}`);
  }

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* Zero line */}
      <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="var(--dawn-08)" strokeWidth="1" />
    </svg>
  );
}

function DataChart({ seed }: { seed: number }) {
  const bars: number[] = [];
  const barCount = 40;

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount;
    const value = Math.abs(Math.sin(t * 10 + seed * 5) * Math.cos(t * 7)) * 0.8 + 0.2;
    bars.push(value);
  }

  return (
    <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
      {bars.map((height, i) => (
        <rect
          key={i}
          x={i * 5}
          y={60 - height * 50}
          width="3"
          height={height * 50}
          fill="var(--dawn-30)"
        />
      ))}
    </svg>
  );
}

function CognitiveDepthDisplay({ coordinates }: { coordinates: { geometry: number; alterity: number; dynamics: number } }) {
  // Create a gradient based on coordinates
  const depth = (coordinates.geometry + coordinates.alterity + coordinates.dynamics + 3) / 6; // Normalize to 0-1

  return (
    <div className="relative h-[60px]">
      {/* Gradient spectrum */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, #1a0a0a 0%, #3d1515 20%, #5a3a2a 40%, #8a7a5a 60%, #c4b48a 80%, #f5f0e0 100%)',
          opacity: 0.8,
        }}
      />

      {/* Position indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[var(--dawn)]"
        style={{ left: `${depth * 100}%` }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--dawn)]" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-[var(--dawn)]" />
      </div>

      {/* Label */}
      <div
        className="absolute bottom-0 left-0 right-0 text-center hud-sublabel"
        style={{ background: 'linear-gradient(0deg, rgba(5,4,3,0.8) 0%, transparent 100%)', paddingTop: '20px' }}
      >
        POSITION • ENTITY
      </div>
    </div>
  );
}

function LogSection({
  title,
  timestamp,
  children
}: {
  title: string;
  timestamp: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-[var(--gold)]" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: 'var(--gold)',
            }}
          >
            {title}
          </span>
        </div>
        <span className="hud-sublabel">[{timestamp}]</span>
      </div>
      {children}
    </div>
  );
}

function LogField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="hud-sublabel mb-0.5">{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--dawn-70)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
