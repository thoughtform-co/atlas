'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Denizen } from '@/lib/types';
import Image from 'next/image';

interface DenizenModalProps {
  denizen: Denizen | null;
  onClose: () => void;
  onNavigate?: (denizenId: string) => void;
  allDenizens?: Denizen[];
}

/**
 * DenizenModal — Expanded detail view for a denizen
 *
 * Two-column layout:
 * - Left: Portrait + Core Identity + Cardinal Coordinates
 * - Right: Description, Lore, Features, Connections
 *
 * Features:
 * - Coordinate visualization bars
 * - Connected entity navigation
 * - Allegiance-aware coloring
 * - Responsive single-column on mobile
 * - Keyboard navigation (Escape to close)
 */
export function DenizenModal({ denizen, onClose, onNavigate, allDenizens = [] }: DenizenModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Format coordinate for display
  const formatCoord = (n: number): string => {
    const sign = n < 0 ? '-' : '';
    return sign + Math.abs(n).toFixed(3).slice(1);
  };

  // Convert coordinate to percentage for bar (maps -1 to 1 → 0% to 100%)
  const coordToPercent = (n: number): number => {
    return ((n + 1) / 2) * 100;
  };

  // Get threat dot classes
  const getThreatClasses = (level: string): string => {
    const base = 'threat-dot w-1.5 h-1.5';
    switch (level) {
      case 'Benign':
        return `${base} bg-[var(--threat-benign)]`;
      case 'Cautious':
        return `${base} bg-[var(--threat-cautious)]`;
      case 'Volatile':
        return `${base} bg-[var(--threat-volatile)] shadow-[0_0_8px_var(--gold-dim)]`;
      case 'Existential':
        return `${base} bg-[var(--threat-existential)] animate-pulse-threat`;
      default:
        return `${base} bg-[var(--dawn-30)]`;
    }
  };

  // Get allegiance color class
  const getAllegianceClass = (allegiance: string): string => {
    switch (allegiance) {
      case 'Liminal Covenant':
        return 'text-[var(--cardinal-dynamics)]';
      case 'Nomenclate':
        return 'text-[var(--threat-existential)]';
      default:
        return 'text-[var(--dawn-50)]';
    }
  };

  // Get connected denizen data
  const getConnectedDenizen = (id: string): Denizen | undefined => {
    return allDenizens.find((d) => d.id === id);
  };

  if (!denizen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      onClick={handleBackdropClick}
      style={{
        background: 'rgba(5, 4, 3, 0.9)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        className="modal relative grid grid-cols-1 md:grid-cols-[280px_1fr] max-w-[820px] w-full border border-[var(--dawn-15)] overflow-hidden"
        style={{
          background: 'var(--surface-0)',
          animation: 'slideIn 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-5 h-5 border-t border-l border-[var(--dawn-30)] pointer-events-none" />
        <div className="absolute -bottom-px -right-px w-5 h-5 border-b border-r border-[var(--dawn-30)] pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center border border-[var(--dawn-08)] text-[var(--dawn-30)] hover:border-[var(--dawn-30)] hover:text-[var(--dawn)] hover:bg-[var(--dawn-04)] transition-all duration-200"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}
        >
          ✕
        </button>

        {/* ═══════════════════════════════════════════════════════════════
            LEFT COLUMN — Portrait + Identity
            ═══════════════════════════════════════════════════════════════ */}
        <div className="modal__portrait border-b md:border-b-0 md:border-r border-[var(--dawn-08)] flex flex-col">
          {/* Image */}
          <div
            className="relative aspect-[16/9] md:aspect-[3/4] overflow-hidden"
            style={{ background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)' }}
          >
            {denizen.image ? (
              <Image src={denizen.image} alt={denizen.name} fill className="object-cover" />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center select-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '5rem',
                  color: 'var(--dawn-08)',
                }}
              >
                {denizen.type[0]}
              </div>
            )}

            {/* Glyphs */}
            <div
              className="absolute top-4 right-4"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                lineHeight: 1.8,
                color: 'var(--dawn-30)',
                letterSpacing: '0.1em',
                writingMode: 'vertical-rl',
              }}
            >
              {denizen.glyphs}
            </div>

            {/* Threat badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              <div className={getThreatClasses(denizen.threatLevel)} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-30)',
                }}
              >
                {denizen.threatLevel}
              </span>
            </div>
          </div>

          {/* Identity */}
          <div
            className="identity-section flex-1 flex flex-col"
            style={{
              paddingLeft: '28px',
              paddingRight: '28px',
              paddingTop: '24px',
              paddingBottom: '32px',
            }}
          >
            <div
              className="mb-2"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--dawn-30)',
              }}
            >
              {denizen.type}
            </div>

            <h2
              className="mb-1"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '16px',
                fontWeight: 400,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--dawn)',
                lineHeight: 1.3,
              }}
            >
              {denizen.name}
            </h2>

            {denizen.subtitle && (
              <div
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: 'var(--dawn-50)',
                }}
              >
                {denizen.subtitle}
              </div>
            )}

            {/* Coordinates */}
            <div className="mt-auto pt-4 border-t border-[var(--dawn-08)]">
              <div
                className="mb-2.5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-30)',
                }}
              >
                Cardinal Position
              </div>

              <div className="flex flex-col gap-1.5">
                {/* Geometry */}
                <CoordinateRow
                  symbol="◆"
                  symbolClass="text-[var(--gold)]"
                  name="Geometry"
                  value={formatCoord(denizen.coordinates.geometry)}
                  percent={coordToPercent(denizen.coordinates.geometry)}
                  fillClass="bg-[var(--gold)]"
                />
                {/* Alterity */}
                <CoordinateRow
                  symbol="○"
                  symbolClass="text-[var(--dawn-50)]"
                  name="Alterity"
                  value={formatCoord(denizen.coordinates.alterity)}
                  percent={coordToPercent(denizen.coordinates.alterity)}
                  fillClass="bg-[var(--dawn-50)]"
                />
                {/* Dynamics */}
                <CoordinateRow
                  symbol="◇"
                  symbolClass="text-[var(--cardinal-dynamics)]"
                  name="Dynamics"
                  value={formatCoord(denizen.coordinates.dynamics)}
                  percent={coordToPercent(denizen.coordinates.dynamics)}
                  fillClass="bg-[var(--cardinal-dynamics)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT COLUMN — Details
            ═══════════════════════════════════════════════════════════════ */}
        <div
          className="modal__content flex flex-col gap-[24px] max-h-[60vh] md:max-h-[520px] overflow-y-auto"
          style={{
            paddingLeft: '28px',
            paddingRight: '48px',
            paddingTop: '24px',
            paddingBottom: '24px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--dawn-15) var(--dawn-04)',
          }}
        >
          {/* Description */}
          <section>
            <SectionLabel>Description</SectionLabel>
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
          </section>

          {/* Lore */}
          {denizen.lore && (
            <section>
              <SectionLabel>Historical Record</SectionLabel>
              <div
                className="relative pl-4"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: 'var(--dawn-50)',
                  fontStyle: 'italic',
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5"
                  style={{ background: 'linear-gradient(180deg, var(--gold) 0%, transparent 100%)' }}
                />
                {denizen.lore}
              </div>
            </section>
          )}

          {/* Features */}
          {denizen.features && denizen.features.length > 0 && (
            <section>
              <SectionLabel>Observed Capabilities</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {denizen.features.map((feature, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1.5 border border-[var(--dawn-08)] hover:border-[var(--dawn-15)] hover:text-[var(--dawn-70)] transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.03em',
                      color: 'var(--dawn-50)',
                      background: 'var(--dawn-04)',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Domain + Allegiance */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--dawn-08)]">
            <div>
              <div
                className="mb-1"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-30)',
                }}
              >
                Domain
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--dawn-50)',
                }}
              >
                {denizen.domain}
              </div>
            </div>
            <div>
              <div
                className="mb-1"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-30)',
                }}
              >
                Allegiance
              </div>
              <div
                className={getAllegianceClass(denizen.allegiance)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                }}
              >
                {denizen.allegiance}
              </div>
            </div>
          </div>

          {/* Connected Entities */}
          {denizen.connections && denizen.connections.length > 0 && (
            <section>
              <SectionLabel>Connected Entities</SectionLabel>
              <div className="flex flex-wrap gap-3">
                {denizen.connections.map((connectionId) => {
                  const connected = getConnectedDenizen(connectionId);
                  if (!connected) return null;

                  return (
                    <button
                      key={connectionId}
                      onClick={() => onNavigate?.(connectionId)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 border border-[var(--dawn-08)] hover:border-[var(--dawn-30)] rounded-sm transition-all duration-200"
                      style={{ background: 'var(--surface-1)' }}
                    >
                      <div
                        className="w-7 h-7 flex items-center justify-center rounded-[2px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: 'var(--dawn-15)',
                          background: 'var(--dawn-04)',
                        }}
                      >
                        {connected.type[0]}
                      </div>
                      <div className="text-left">
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: 'var(--dawn-50)',
                          }}
                        >
                          {connected.name}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '7px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--dawn-30)',
                          }}
                        >
                          {connected.type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
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
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal__content::-webkit-scrollbar {
          width: 4px;
        }

        .modal__content::-webkit-scrollbar-track {
          background: var(--dawn-04);
        }

        .modal__content::-webkit-scrollbar-thumb {
          background: var(--dawn-15);
        }

        /* Desktop padding overrides - pixel-exact from mockups */
        @media (min-width: 768px) {
          .identity-section {
            padding-left: 36px;
            padding-right: 36px;
          }

          .modal__content {
            padding-left: 36px;
            padding-right: 56px;
            padding-top: 56px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * SectionLabel — Consistent section header with divider line
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 mb-2.5"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '8px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--dawn-30)',
      }}
    >
      {children}
      <div className="flex-1 h-px bg-[var(--dawn-08)]" />
    </div>
  );
}

/**
 * CoordinateRow — Single coordinate with label and visual bar
 */
interface CoordinateRowProps {
  symbol: string;
  symbolClass: string;
  name: string;
  value: string;
  percent: number;
  fillClass: string;
}

function CoordinateRow({ symbol, symbolClass, name, value, percent, fillClass }: CoordinateRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] w-3 ${symbolClass}`}>{symbol}</span>
      <span
        className="w-[70px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--dawn-30)',
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--dawn-50)',
        }}
      >
        {value}
      </span>
      <div
        className="relative"
        style={{
          flex: 1,
          height: '2px',
          background: 'var(--dawn-08)',
          marginLeft: '8px',
          marginRight: '16px',
        }}
      >
        <div
          className={`absolute top-0 left-0 h-full ${fillClass}`}
          style={{
            width: `${percent}%`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}
