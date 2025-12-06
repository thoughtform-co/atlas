'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
 * Full-screen research station interface with:
 * - Left: Media viewer with animated HUD overlays
 * - Right: Retrofuturistic xenobiologist research log
 */
export function DenizenModalV3({ denizen, onClose, onNavigate, allDenizens = [] }: DenizenModalV3Props) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

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

  // Get connected denizen
  const getConnectedDenizen = (id: string): Denizen | undefined => {
    return allDenizens.find((d) => d.id === id);
  };

  // Convert cardinal value to percentage (from -1 to 1 range)
  const cardinalToPercent = (val: number) => ((val + 1) / 2) * 100;

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

  // Build media array from denizen data
  const mediaItems = denizen.media?.length
    ? denizen.media.map(m => ({ id: m.id, url: m.storagePath, mediaType: m.mediaType }))
    : denizen.image
      ? [{ id: '1', url: denizen.image, mediaType: 'image' as const }]
      : [];

  // Derived values for HUD
  const semanticDrift = Math.abs(denizen.coordinates.dynamics * 0.05).toFixed(3);
  const manifoldStability = Math.round((1 - Math.abs(denizen.coordinates.alterity)) * 100);
  const cognitiveDepth = (denizen.coordinates.geometry + denizen.coordinates.alterity + denizen.coordinates.dynamics + 3) / 6;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{
        background: 'rgba(7, 6, 4, 0.95)',
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
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .rotate-slow { animation: rotateSlow 60s linear infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }

        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: #0D0B07; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(236, 227, 214, 0.15); }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(236, 227, 214, 0.3); }
      `}</style>

      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_360px] w-full max-w-[1100px] h-[85vh] max-h-[750px] relative overflow-hidden"
        style={{
          background: '#0D0B07',
          border: '1px solid rgba(236, 227, 214, 0.15)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-transparent border text-lg flex items-center justify-center z-50 transition-all duration-150"
          style={{
            borderColor: 'rgba(236, 227, 214, 0.15)',
            color: 'rgba(236, 227, 214, 0.5)',
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(236, 227, 214, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.3)';
            e.currentTarget.style.color = '#ECE3D6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
            e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)';
          }}
        >
          ×
        </button>

        {/* ═══════════════════════════════════════════════════════════════
            LEFT PANEL — Visual + HUD
            ═══════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden" style={{ background: '#070604' }}>

          {/* Entity Image or Placeholder */}
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
            <EntityImagePlaceholder glyphs={denizen.glyphs} />
          )}

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">

            {/* Top HUD Bar */}
            <div
              className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start"
              style={{ background: 'linear-gradient(to bottom, rgba(7,6,4,0.9) 0%, transparent 100%)' }}
            >
              <div className="flex flex-col gap-1">
                <span
                  className="tracking-[0.1em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(236, 227, 214, 0.4)' }}
                >
                  Meta Sacrem Geometry
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ECE3D6' }}>
                  REST: <span style={{ color: '#CAA554' }}>{denizen.coordinates.geometry.toFixed(3)}</span>
                </span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span
                  className="tracking-[0.1em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(236, 227, 214, 0.4)' }}
                >
                  Read Timestamp
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ECE3D6' }}>
                  {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
            </div>

            {/* Left Thumbnails */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-2 pointer-events-auto"
              style={{ background: 'rgba(7, 6, 4, 0.9)', borderRight: '1px solid rgba(236, 227, 214, 0.08)' }}
            >
              {mediaItems.length > 0 ? (
                mediaItems.slice(0, 5).map((media, i) => (
                  <button
                    key={media.id}
                    onClick={() => setSelectedMediaIndex(i)}
                    className="w-10 h-14 cursor-pointer transition-all duration-150"
                    style={{
                      border: selectedMediaIndex === i ? '1px solid rgba(236, 227, 214, 0.3)' : '1px solid rgba(236, 227, 214, 0.08)',
                      opacity: selectedMediaIndex === i ? 1 : 0.5,
                      background: '#0D0B07',
                    }}
                  >
                    {media.mediaType === 'image' && media.url ? (
                      <div className="relative w-full h-full">
                        <Image src={media.url} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: 'linear-gradient(to bottom right, #141210, #0D0B07)' }}
                      />
                    )}
                  </button>
                ))
              ) : (
                [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-14 transition-all duration-150"
                    style={{
                      border: i === 0 ? '1px solid rgba(236, 227, 214, 0.3)' : '1px solid rgba(236, 227, 214, 0.08)',
                      opacity: i === 0 ? 1 : 0.5,
                      background: '#0D0B07',
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{ background: 'linear-gradient(to bottom right, #141210, #0D0B07)' }}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Data Fragments */}
            <div className="absolute left-16 top-[28%] flex flex-col gap-2">
              <DataFragment label={`EPOCH.${denizen.firstObserved || '4.2847'}`} />
              <DataFragment label={`SEMANTIC_DRIFT: ${semanticDrift}`} />
              <DataFragment label={`MANIFOLD_STABILITY: ${manifoldStability}%`} />
            </div>

            {/* Reticle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48">
              <div className="absolute inset-0 border rounded-full" style={{ borderColor: 'rgba(236, 227, 214, 0.1)' }} />
              <div className="absolute inset-[20%] border rounded-full" style={{ borderColor: 'rgba(236, 227, 214, 0.06)' }} />
              <div
                className="absolute inset-[-10%] border border-dashed rounded-full rotate-slow"
                style={{ borderColor: 'rgba(236, 227, 214, 0.06)', transformOrigin: 'center' }}
              />
              <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2" style={{ background: 'rgba(236, 227, 214, 0.1)' }} />
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'rgba(236, 227, 214, 0.1)' }} />
            </div>

            {/* Cardinal Position */}
            <div
              className="absolute bottom-4 left-4 p-3"
              style={{ background: 'rgba(7, 6, 4, 0.8)', border: '1px solid rgba(236, 227, 214, 0.08)' }}
            >
              <div
                className="mb-2 tracking-[0.1em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
              >
                Cardinal Position
              </div>
              <div className="flex flex-col gap-2">
                <CardinalRow glyph="◆" label="GEO" value={denizen.coordinates.geometry} color="#CAA554" cardinalToPercent={cardinalToPercent} />
                <CardinalRow glyph="○" label="ALT" value={denizen.coordinates.alterity} color="#ECE3D6" cardinalToPercent={cardinalToPercent} />
                <CardinalRow glyph="◇" label="DYN" value={denizen.coordinates.dynamics} color="#5B8A7A" cardinalToPercent={cardinalToPercent} />
              </div>
            </div>

            {/* Depth Gauge */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-48 p-2 flex flex-col"
              style={{ background: 'rgba(7, 6, 4, 0.8)', border: '1px solid rgba(236, 227, 214, 0.08)' }}
            >
              <span
                className="tracking-[0.05em] uppercase"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  color: 'rgba(236, 227, 214, 0.3)',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)'
                }}
              >
                Cognitive Depth
              </span>
              <div
                className="flex-1 mt-2 relative"
                style={{
                  background: 'linear-gradient(to top, #CAA554 0%, rgba(236, 227, 214, 0.5) 50%, #5B8A7A 100%)',
                  opacity: 0.3
                }}
              >
                <div
                  className="absolute left-[-4px] right-[-4px] h-0.5 transition-all duration-300"
                  style={{
                    top: `${(1 - cognitiveDepth) * 100}%`,
                    background: '#ECE3D6',
                    boxShadow: '0 0 8px #ECE3D6'
                  }}
                />
              </div>
            </div>

            {/* Waveform */}
            <div
              className="absolute bottom-4 right-4 w-48 p-2"
              style={{ background: 'rgba(7, 6, 4, 0.8)', border: '1px solid rgba(236, 227, 214, 0.08)' }}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className="tracking-[0.1em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
                >
                  Waveform
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.5)' }}>
                  54.03 GHz
                </span>
              </div>
              <Waveform width={180} height={40} />
            </div>

            {/* Data Visualization */}
            <div
              className="absolute bottom-20 right-4 w-48 p-2"
              style={{ background: 'rgba(7, 6, 4, 0.8)', border: '1px solid rgba(236, 227, 214, 0.08)' }}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className="tracking-[0.1em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
                >
                  Data
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.5)' }}>
                  100-400Hz
                </span>
              </div>
              <DataBar width={180} height={30} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT PANEL — Research Log
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col overflow-y-auto custom-scroll"
          style={{
            background: '#141210',
            borderLeft: '1px solid rgba(236, 227, 214, 0.15)'
          }}
        >
          {/* Header */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(236, 227, 214, 0.08)', background: '#0D0B07' }}>
            <div className="flex justify-between items-center mb-3">
              <span
                className="tracking-[0.08em] uppercase flex items-center gap-2"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
              >
                <span style={{ color: '#CAA554', fontSize: '8px' }}>■</span>
                Xenobiology Research Log
              </span>
            </div>
            <h1
              className="tracking-[0.02em] mb-1"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: '#ECE3D6' }}
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

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col gap-5">

            {/* Classification */}
            <LogSection title="Classification" timestamp={`EPOCH.${denizen.firstObserved || '4.2847'}`}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <LogField label="Species Type" value={denizen.type} />
                <div className="flex flex-col gap-0.5">
                  <span
                    className="tracking-[0.05em] uppercase"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
                  >
                    Threat Level
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2"
                          style={{ background: i <= getThreatScore(denizen.threatLevel) ? '#C17F59' : 'rgba(236, 227, 214, 0.15)' }}
                        />
                      ))}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ECE3D6' }}>
                      {denizen.threatLevel}
                    </span>
                  </div>
                </div>
                <LogField label="Domain" value={denizen.domain} />
                <LogField label="Allegiance" value={denizen.allegiance} />
              </div>
            </LogSection>

            {/* Primary Observation */}
            <LogSection title="Primary Observation" timestamp="UPDATED">
              <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(236, 227, 214, 0.7)' }}>
                {denizen.description}
              </p>
            </LogSection>

            {/* Historical Record */}
            {denizen.lore && (
              <LogSection title="Historical Record" timestamp="ARCHIVAL">
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(236, 227, 214, 0.7)' }}>
                  {denizen.lore}
                </p>
              </LogSection>
            )}

            {/* Observed Capabilities */}
            {denizen.features && denizen.features.length > 0 && (
              <LogSection title="Observed Capabilities" timestamp="VERIFIED">
                <div className="flex flex-col gap-1.5">
                  {denizen.features.map((cap, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(236, 227, 214, 0.7)' }}
                    >
                      <span style={{ color: 'rgba(236, 227, 214, 0.3)' }}>·</span>
                      {cap}
                    </div>
                  ))}
                </div>
              </LogSection>
            )}

            {/* Known Associations */}
            {denizen.connections && denizen.connections.length > 0 && (
              <LogSection title="Known Associations" timestamp="MAPPED">
                <div className="flex flex-wrap gap-2">
                  {denizen.connections.map((connId) => {
                    const connected = getConnectedDenizen(connId);
                    if (!connected) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => onNavigate?.(connId)}
                        className="px-2 py-1 cursor-pointer transition-all duration-150"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.02em',
                          color: 'rgba(236, 227, 214, 0.7)',
                          background: 'rgba(236, 227, 214, 0.04)',
                          border: '1px solid rgba(236, 227, 214, 0.08)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(236, 227, 214, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
                          e.currentTarget.style.color = '#ECE3D6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(236, 227, 214, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.08)';
                          e.currentTarget.style.color = 'rgba(236, 227, 214, 0.7)';
                        }}
                      >
                        <span style={{ color: 'rgba(236, 227, 214, 0.3)' }}>↗ </span>
                        {connected.name}
                      </button>
                    );
                  })}
                </div>
              </LogSection>
            )}

            {/* Glyphs */}
            <LogSection title="Glyphs">
              <div className="flex gap-3 mt-1">
                {denizen.glyphs.split('').map((glyph, i) => (
                  <span
                    key={i}
                    className="text-base"
                    style={{ color: i < 2 ? '#ECE3D6' : 'rgba(236, 227, 214, 0.3)' }}
                  >
                    {glyph}
                  </span>
                ))}
              </div>
            </LogSection>

            {/* Researcher Notes */}
            <LogSection title="Researcher Notes" timestamp="PENDING">
              <div
                className="p-3"
                style={{
                  background: '#0D0B07',
                  border: '1px solid rgba(236, 227, 214, 0.08)',
                  borderLeft: '2px solid rgba(202, 165, 84, 0.4)',
                }}
              >
                <p
                  className="italic"
                  style={{ fontSize: '12px', lineHeight: 1.7, color: 'rgba(236, 227, 214, 0.5)' }}
                >
                  [Awaiting field observations. Entity requires further study.]
                </p>
              </div>
            </LogSection>
          </div>

          {/* Footer */}
          <div
            className="p-4 flex justify-between items-center"
            style={{ borderTop: '1px solid rgba(236, 227, 214, 0.08)', background: '#0D0B07' }}
          >
            <span
              className="tracking-[0.05em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
            >
              ID: {denizen.id.toUpperCase()}
            </span>
            <span
              className="tracking-[0.05em]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
            >
              Atlas Research Division
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function Waveform({ width = 200, height = 40 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(236, 227, 214, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const y = height / 2 +
          Math.sin((x / width) * 8 * Math.PI + phaseRef.current) * 8 +
          Math.sin((x / width) * 16 * Math.PI + phaseRef.current * 1.5) * 4 +
          Math.sin((x / width) * 32 * Math.PI + phaseRef.current * 0.7) * 2;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      phaseRef.current += 0.02;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
}

function DataBar({ width = 60, height = 30 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(Math.random() * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    const barCount = 20;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const barWidth = (width / barCount) - 1;
        const x = i * (width / barCount);
        const barHeight = Math.abs(Math.sin((i / barCount) * Math.PI * 2 + phaseRef.current * 0.5)) * height * 0.8;
        const y = height - barHeight;

        ctx.fillStyle = 'rgba(202, 165, 84, 0.4)';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phaseRef.current += 0.03;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function EntityImagePlaceholder({ glyphs }: { glyphs: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-64 h-80 flex items-center justify-center">
        <svg viewBox="0 0 200 280" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 40px rgba(202, 165, 84, 0.2))' }}>
          <defs>
            <linearGradient id="figureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ECE3D6', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#CAA554', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#070604', stopOpacity: 0.8 }} />
            </linearGradient>
            <linearGradient id="haloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'transparent' }} />
              <stop offset="50%" style={{ stopColor: '#CAA554', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: 'transparent' }} />
            </linearGradient>
          </defs>

          {/* Halo rings */}
          <ellipse cx="100" cy="70" rx="80" ry="15" fill="none" stroke="url(#haloGradient)" strokeWidth="1" />
          <ellipse cx="100" cy="70" rx="70" ry="12" fill="none" stroke="rgba(202, 165, 84, 0.3)" strokeWidth="0.5" />
          <ellipse cx="100" cy="70" rx="60" ry="9" fill="none" stroke="rgba(202, 165, 84, 0.2)" strokeWidth="0.5" />

          {/* Horns */}
          <path d="M70,90 Q50,50 60,30" fill="none" stroke="rgba(236, 227, 214, 0.4)" strokeWidth="3" />
          <path d="M130,90 Q150,50 140,30" fill="none" stroke="rgba(236, 227, 214, 0.4)" strokeWidth="3" />

          {/* Body */}
          <path
            d="M100,85 Q120,100 125,130 L140,180 Q145,220 130,280 L70,280 Q55,220 60,180 L75,130 Q80,100 100,85"
            fill="url(#figureGradient)"
          />

          {/* Arms */}
          <path d="M75,120 Q40,130 20,100" fill="none" stroke="rgba(236, 227, 214, 0.3)" strokeWidth="4" strokeLinecap="round" />
          <path d="M125,120 Q160,130 175,140" fill="none" stroke="rgba(236, 227, 214, 0.3)" strokeWidth="4" strokeLinecap="round" />

          {/* Book */}
          <rect x="155" y="125" width="35" height="25" fill="rgba(236, 227, 214, 0.5)" transform="rotate(15, 172, 137)" />

          {/* Head */}
          <ellipse cx="100" cy="95" rx="20" ry="25" fill="rgba(236, 227, 214, 0.25)" />
        </svg>

        {/* Glyphs overlay */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 tracking-[0.3em]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'rgba(236, 227, 214, 0.2)' }}
        >
          {glyphs}
        </div>

        {/* Glitch lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px"
              style={{
                top: `${20 + i * 15}%`,
                background: 'linear-gradient(90deg, transparent 0%, rgba(236, 227, 214, 0.5) 20%, rgba(236, 227, 214, 0.5) 80%, transparent 100%)',
                transform: `translateX(${Math.sin(i) * 10}px)`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DataFragment({ label }: { label: string }) {
  return (
    <div
      className="tracking-[0.05em] px-2 py-0.5"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'rgba(236, 227, 214, 0.3)',
        background: 'rgba(7, 6, 4, 0.6)',
        borderLeft: '1px solid rgba(236, 227, 214, 0.15)',
      }}
    >
      {label}
    </div>
  );
}

function CardinalRow({
  glyph,
  label,
  value,
  color,
  cardinalToPercent
}: {
  glyph: string;
  label: string;
  value: number;
  color: string;
  cardinalToPercent: (val: number) => number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-5 text-center" style={{ color }}>{glyph}</span>
      <div className="w-20 h-1 relative" style={{ background: 'rgba(236, 227, 214, 0.08)' }}>
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{ width: `${cardinalToPercent(value)}%`, background: color }}
        />
      </div>
      <span
        className="w-12 text-right"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(236, 227, 214, 0.5)' }}
      >
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  );
}

function LogSection({
  title,
  timestamp,
  children
}: {
  title: string;
  timestamp?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className="tracking-[0.1em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#CAA554' }}
        >
          {title}
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(202, 165, 84, 0.4) 0%, transparent 100%)' }}
        />
        {timestamp && (
          <span
            className="tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'rgba(236, 227, 214, 0.3)' }}
          >
            [{timestamp}]
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function LogField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="tracking-[0.05em] uppercase"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(236, 227, 214, 0.3)' }}
      >
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ECE3D6' }}>
        {value}
      </span>
    </div>
  );
}
