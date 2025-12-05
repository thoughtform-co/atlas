'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Denizen } from '@/lib/types';
import Image from 'next/image';

interface DenizenModalV2Props {
  denizen: Denizen | null;
  onClose: () => void;
  onNavigate?: (denizenId: string) => void;
  allDenizens?: Denizen[];
}

/**
 * DenizenModalV2 — Research Station Style Modal
 *
 * Inspired by scientific visualization interfaces:
 * - Central specimen display
 * - Surrounding data panels with charts and diagnostics
 * - Dark void background with glowing accents
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Type/Status]              HEADER              [Close]      │
 * ├──────────┬──────────────────────────────┬──────────────────┤
 * │ Cardinal │                              │ Threat Analysis  │
 * │ Radar    │                              ├──────────────────┤
 * │ Chart    │      CENTRAL SPECIMEN        │ Connection       │
 * │          │         (Portrait)           │ Network          │
 * ├──────────┤                              ├──────────────────┤
 * │ Waveform │                              │ Capabilities     │
 * │ Display  │                              │ Matrix           │
 * ├──────────┴──────────────────────────────┴──────────────────┤
 * │               DESCRIPTION / LORE PANEL                      │
 * └─────────────────────────────────────────────────────────────┘
 */
export function DenizenModalV2({ denizen, onClose, onNavigate, allDenizens = [] }: DenizenModalV2Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Draw radar chart for coordinates
  useEffect(() => {
    if (!denizen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { geometry, alterity, dynamics } = denizen.coordinates;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid circles
    ctx.strokeStyle = 'rgba(236, 227, 214, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axis lines (3 axes at 120° apart)
    const axes = [
      { angle: -90, color: 'var(--gold)', label: 'G', value: geometry },
      { angle: 30, color: 'var(--dawn-50)', label: 'A', value: alterity },
      { angle: 150, color: 'var(--cardinal-dynamics)', label: 'D', value: dynamics },
    ];

    axes.forEach(({ angle, color, label }) => {
      const rad = (angle * Math.PI) / 180;
      const endX = centerX + Math.cos(rad) * radius;
      const endY = centerY + Math.sin(rad) * radius;

      ctx.strokeStyle = 'rgba(236, 227, 214, 0.15)';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Axis label
      const labelX = centerX + Math.cos(rad) * (radius + 12);
      const labelY = centerY + Math.sin(rad) * (radius + 12);
      ctx.fillStyle = color;
      ctx.font = '9px PT Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, labelX, labelY);
    });

    // Draw data triangle
    const points = axes.map(({ angle, value }) => {
      const rad = (angle * Math.PI) / 180;
      const dist = ((value + 1) / 2) * radius; // Map -1..1 to 0..radius
      return {
        x: centerX + Math.cos(rad) * dist,
        y: centerY + Math.sin(rad) * dist,
      };
    });

    // Fill
    ctx.fillStyle = 'rgba(202, 165, 84, 0.15)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();

    // Stroke
    ctx.strokeStyle = 'var(--gold)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();

    // Data points
    points.forEach((p, i) => {
      ctx.fillStyle = axes[i].color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [denizen]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Get threat styling
  const getThreatStyle = (level: string) => {
    const styles: Record<string, { color: string; glow: string }> = {
      Benign: { color: 'var(--threat-benign)', glow: 'none' },
      Cautious: { color: 'var(--threat-cautious)', glow: 'none' },
      Volatile: { color: 'var(--threat-volatile)', glow: '0 0 12px var(--gold-dim)' },
      Existential: { color: 'var(--threat-existential)', glow: '0 0 16px rgba(139, 90, 90, 0.6)' },
    };
    return styles[level] || { color: 'var(--dawn-30)', glow: 'none' };
  };

  // Get connected denizen
  const getConnectedDenizen = (id: string): Denizen | undefined => {
    return allDenizens.find((d) => d.id === id);
  };

  if (!denizen) return null;

  const threatStyle = getThreatStyle(denizen.threatLevel);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
      onClick={handleBackdropClick}
      style={{
        background: 'rgba(5, 4, 3, 0.95)',
        backdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        className="modal-v2 relative w-full max-w-[1100px] max-h-[90vh] overflow-hidden"
        style={{
          background: 'var(--void)',
          border: '1px solid var(--dawn-08)',
          animation: 'slideIn 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        {/* Corner brackets */}
        <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-[var(--dawn-15)] pointer-events-none" />
        <div className="absolute -top-px -right-px w-8 h-8 border-t border-r border-[var(--dawn-15)] pointer-events-none" />
        <div className="absolute -bottom-px -left-px w-8 h-8 border-b border-l border-[var(--dawn-15)] pointer-events-none" />
        <div className="absolute -bottom-px -right-px w-8 h-8 border-b border-r border-[var(--dawn-15)] pointer-events-none" />

        {/* ═══════════════════════════════════════════════════════════════
            HEADER BAR
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b border-[var(--dawn-08)]"
          style={{ background: 'var(--surface-0)' }}
        >
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: threatStyle.color, boxShadow: threatStyle.glow }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-30)',
                }}
              >
                {denizen.threatLevel}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-3 bg-[var(--dawn-08)]" />

            {/* Type badge */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--dawn-50)',
              }}
            >
              {denizen.type}
            </span>
          </div>

          {/* Glyphs in header */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.3em',
              color: 'var(--dawn-15)',
            }}
          >
            {denizen.glyphs}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[var(--dawn-08)] text-[var(--dawn-30)] hover:border-[var(--dawn-30)] hover:text-[var(--dawn)] hover:bg-[var(--dawn-04)] transition-all duration-200"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN GRID LAYOUT
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_220px]">
          {/* ─────────────────────────────────────────────────────────────
              LEFT PANELS
              ───────────────────────────────────────────────────────────── */}
          <div className="hidden md:flex flex-col border-r border-[var(--dawn-08)]">
            {/* Cardinal Radar Chart */}
            <DataPanel title="Cardinal Position" className="flex-1">
              <canvas ref={canvasRef} width={160} height={140} className="mx-auto" />
              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <CoordValue symbol="◆" color="var(--gold)" value={denizen.coordinates.geometry} />
                <CoordValue symbol="○" color="var(--dawn-50)" value={denizen.coordinates.alterity} />
                <CoordValue symbol="◇" color="var(--cardinal-dynamics)" value={denizen.coordinates.dynamics} />
              </div>
            </DataPanel>

            {/* Waveform Visualization */}
            <DataPanel title="Semantic Resonance" className="border-t border-[var(--dawn-08)]">
              <WaveformDisplay coordinates={denizen.coordinates} />
            </DataPanel>

            {/* Domain Info */}
            <DataPanel title="Domain" className="border-t border-[var(--dawn-08)]">
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--dawn-50)',
                  textAlign: 'center',
                }}
              >
                {denizen.domain}
              </div>
            </DataPanel>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CENTER - SPECIMEN DISPLAY
              ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col">
            {/* Main Image */}
            <div
              className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden"
              style={{
                background: 'radial-gradient(circle at center, var(--surface-1) 0%, var(--void) 100%)',
              }}
            >
              {denizen.image ? (
                <>
                  <Image src={denizen.image} alt={denizen.name} fill className="object-contain" />
                  {/* Scan lines overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      background:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(5,4,3,0.3) 2px, rgba(5,4,3,0.3) 4px)',
                    }}
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center select-none"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8rem',
                    color: 'var(--dawn-04)',
                  }}
                >
                  {denizen.glyphs[0]}
                </div>
              )}

              {/* Corner measurement marks */}
              <CornerMark position="top-left" />
              <CornerMark position="top-right" />
              <CornerMark position="bottom-left" />
              <CornerMark position="bottom-right" />

              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--void)] to-transparent">
                <h2
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    fontWeight: 400,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--dawn)',
                  }}
                >
                  {denizen.name}
                </h2>
                {denizen.subtitle && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: 'var(--dawn-50)',
                      marginTop: '4px',
                    }}
                  >
                    {denizen.subtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Description panel */}
            <div
              className="p-5 border-t border-[var(--dawn-08)] overflow-y-auto"
              style={{ maxHeight: '200px', scrollbarWidth: 'thin', scrollbarColor: 'var(--dawn-15) var(--dawn-04)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: 'var(--dawn-70)',
                }}
              >
                {denizen.description}
              </p>

              {denizen.lore && (
                <div
                  className="relative mt-4 pt-4 border-t border-[var(--dawn-08)]"
                  style={{
                    paddingLeft: '16px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: 'var(--dawn-50)',
                    fontStyle: 'italic',
                  }}
                >
                  <div
                    className="absolute left-0 top-4 bottom-0"
                    style={{
                      width: '2px',
                      background: 'linear-gradient(180deg, var(--gold) 0%, transparent 100%)',
                    }}
                  />
                  {denizen.lore}
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT PANELS
              ───────────────────────────────────────────────────────────── */}
          <div className="hidden md:flex flex-col border-l border-[var(--dawn-08)]">
            {/* Threat Analysis */}
            <DataPanel title="Threat Analysis">
              <ThreatMeter level={denizen.threatLevel} />
              <div
                className="mt-3 text-center"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: threatStyle.color,
                }}
              >
                {denizen.threatLevel}
              </div>
            </DataPanel>

            {/* Connection Network */}
            <DataPanel title="Connection Network" className="flex-1 border-t border-[var(--dawn-08)]">
              <div className="flex flex-col gap-2">
                {denizen.connections.length > 0 ? (
                  denizen.connections.slice(0, 4).map((connId) => {
                    const connected = getConnectedDenizen(connId);
                    if (!connected) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => onNavigate?.(connId)}
                        className="flex items-center gap-2 p-2 border border-[var(--dawn-08)] hover:border-[var(--dawn-30)] transition-all duration-200"
                        style={{ background: 'var(--surface-0)' }}
                      >
                        <div
                          className="w-6 h-6 flex items-center justify-center"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color: 'var(--dawn-15)',
                            background: 'var(--dawn-04)',
                          }}
                        >
                          {connected.type[0]}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div
                            className="truncate"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '9px',
                              letterSpacing: '0.03em',
                              textTransform: 'uppercase',
                              color: 'var(--dawn-50)',
                            }}
                          >
                            {connected.name}
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '8px',
                            color: 'var(--dawn-30)',
                          }}
                        >
                          →
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div
                    className="text-center py-4"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: 'var(--dawn-30)',
                    }}
                  >
                    No connections
                  </div>
                )}
              </div>
            </DataPanel>

            {/* Capabilities */}
            <DataPanel title="Capabilities" className="border-t border-[var(--dawn-08)]">
              <div className="flex flex-wrap gap-1">
                {denizen.features?.slice(0, 6).map((feature, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 border border-[var(--dawn-08)]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '8px',
                      letterSpacing: '0.02em',
                      color: 'var(--dawn-50)',
                      background: 'var(--dawn-04)',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </DataPanel>

            {/* Allegiance */}
            <DataPanel title="Allegiance" className="border-t border-[var(--dawn-08)]">
              <AllegianceDisplay allegiance={denizen.allegiance} />
            </DataPanel>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER STATUS BAR
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="flex items-center justify-between px-6 py-2 border-t border-[var(--dawn-08)]"
          style={{ background: 'var(--surface-0)' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: 'var(--dawn-30)',
            }}
          >
            ID: {denizen.id.toUpperCase()}
          </div>
          <div className="flex items-center gap-3">
            <StatusDot active />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                letterSpacing: '0.1em',
                color: 'var(--dawn-30)',
              }}
            >
              {denizen.firstObserved || 'EPOCH UNKNOWN'}
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: 'var(--dawn-30)',
            }}
          >
            ATLAS RESEARCH STATION
          </div>
        </div>
      </div>

      {/* Keyframe styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function DataPanel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 ${className}`}>
      <div
        className="mb-3 flex items-center gap-2"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--dawn-30)',
        }}
      >
        <span>{title}</span>
        <div className="flex-1 h-px bg-[var(--dawn-08)]" />
      </div>
      {children}
    </div>
  );
}

function CoordValue({ symbol, color, value }: { symbol: string; color: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span style={{ color, fontSize: '10px' }}>{symbol}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--dawn-50)',
        }}
      >
        {value > 0 ? '+' : ''}
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function WaveformDisplay({ coordinates }: { coordinates: { geometry: number; alterity: number; dynamics: number } }) {
  // Generate pseudo-waveform based on coordinates
  const points: string[] = [];
  const width = 160;
  const height = 50;

  for (let x = 0; x < width; x++) {
    const t = x / width;
    const y =
      height / 2 +
      Math.sin(t * Math.PI * 4 + coordinates.geometry * 2) * 10 * (0.5 + coordinates.alterity * 0.5) +
      Math.sin(t * Math.PI * 8 + coordinates.dynamics * 3) * 6;
    points.push(`${x},${y}`);
  }

  return (
    <svg width={width} height={height} className="mx-auto">
      {/* Grid lines */}
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--dawn-08)" strokeWidth="1" />
      {/* Waveform */}
      <polyline points={points.join(' ')} fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.7" />
      {/* Highlight points */}
      {[0.25, 0.5, 0.75].map((t, i) => {
        const x = t * width;
        const y =
          height / 2 +
          Math.sin(t * Math.PI * 4 + coordinates.geometry * 2) * 10 * (0.5 + coordinates.alterity * 0.5) +
          Math.sin(t * Math.PI * 8 + coordinates.dynamics * 3) * 6;
        return <circle key={i} cx={x} cy={y} r="2" fill="var(--gold)" />;
      })}
    </svg>
  );
}

function ThreatMeter({ level }: { level: string }) {
  const levels = ['Benign', 'Cautious', 'Volatile', 'Existential'];
  const currentIndex = levels.indexOf(level);
  const colors = ['var(--threat-benign)', 'var(--threat-cautious)', 'var(--threat-volatile)', 'var(--threat-existential)'];

  return (
    <div className="flex gap-1 justify-center">
      {levels.map((l, i) => (
        <div
          key={l}
          className="h-8 flex-1"
          style={{
            background: i <= currentIndex ? colors[i] : 'var(--dawn-08)',
            opacity: i <= currentIndex ? 1 : 0.3,
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

function AllegianceDisplay({ allegiance }: { allegiance: string }) {
  const getAllegianceStyle = () => {
    switch (allegiance) {
      case 'Liminal Covenant':
        return { color: 'var(--cardinal-dynamics)', symbol: '⟡' };
      case 'Nomenclate':
        return { color: 'var(--threat-existential)', symbol: '⧫' };
      default:
        return { color: 'var(--dawn-50)', symbol: '○' };
    }
  };

  const style = getAllegianceStyle();

  return (
    <div className="flex items-center justify-center gap-2">
      <span style={{ color: style.color, fontSize: '14px' }}>{style.symbol}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.05em',
          color: style.color,
        }}
      >
        {allegiance}
      </span>
    </div>
  );
}

function CornerMark({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const borderClasses = {
    'top-left': 'border-t border-l',
    'top-right': 'border-t border-r',
    'bottom-left': 'border-b border-l',
    'bottom-right': 'border-b border-r',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} w-4 h-4 ${borderClasses[position]} border-[var(--dawn-15)] pointer-events-none`}
    />
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div
      className="w-1.5 h-1.5 rounded-full"
      style={{
        background: active ? 'var(--threat-benign)' : 'var(--dawn-30)',
        boxShadow: active ? '0 0 6px var(--threat-benign)' : 'none',
      }}
    />
  );
}
