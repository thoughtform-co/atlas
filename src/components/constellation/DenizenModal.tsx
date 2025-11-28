'use client';

import { useEffect, useRef } from 'react';
import { Denizen } from '@/lib/types';
import { formatCoordinate } from '@/lib/utils';

interface DenizenModalProps {
  denizen: Denizen | null;
  onClose: () => void;
  originPosition?: { x: number; y: number } | null;
}

export function DenizenModal({ denizen, onClose, originPosition }: DenizenModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!denizen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{
        background: 'rgba(5, 4, 3, 0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg border border-[var(--dawn-15)] overflow-hidden"
        style={{
          background: 'rgba(10, 9, 8, 0.98)',
          animation: 'zoomIn 0.25s ease-out',
          transformOrigin: originPosition
            ? `${originPosition.x}px ${originPosition.y}px`
            : 'center center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-[var(--dawn-50)] hover:text-[var(--dawn)] transition-colors"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ✕
        </button>

        {/* Image header */}
        <div
          className="w-full relative overflow-hidden"
          style={{ aspectRatio: '16/9', background: 'var(--surface-1)' }}
        >
          <div
            className="w-full h-full flex items-center justify-center text-8xl text-[var(--dawn-08)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {denizen.type[0]}
          </div>
          {/* Glyphs overlay */}
          <div
            className="absolute top-4 right-4 text-xs text-[var(--dawn-30)] tracking-[0.15em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {denizen.glyphs}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Type badge + Threat Level */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="inline-block px-2 py-1 text-[9px] tracking-[0.08em] uppercase text-[var(--dawn-70)] border border-[var(--dawn-15)]"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'var(--dawn-04)',
              }}
            >
              {denizen.type}
            </div>
            <div
              className="inline-block px-2 py-1 text-[9px] tracking-[0.08em] uppercase border border-[var(--dawn-08)]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: denizen.threatLevel === 'Existential' ? 'var(--gold)' :
                       denizen.threatLevel === 'Volatile' ? '#c45c4a' :
                       'var(--dawn-50)',
              }}
            >
              {denizen.threatLevel}
            </div>
          </div>

          {/* Name + Subtitle */}
          <h2
            className="text-xl text-[var(--dawn)] mb-1 tracking-[0.02em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {denizen.name}
          </h2>
          {denizen.subtitle && (
            <div
              className="text-sm text-[var(--dawn-50)] mb-4 italic"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {denizen.subtitle}
            </div>
          )}

          {/* Coordinates */}
          <div
            className="text-[10px] tracking-[0.1em] text-[var(--dawn-50)] mb-4 pb-4 border-b border-[var(--dawn-08)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span style={{ color: 'var(--gold)' }}>◆</span> {formatCoordinate(denizen.coordinates.geometry)} │{' '}
            <span style={{ color: 'var(--dawn-70)' }}>○</span> {formatCoordinate(denizen.coordinates.alterity)} │{' '}
            <span style={{ color: 'var(--cardinal-dynamics)' }}>◇</span> {formatCoordinate(denizen.coordinates.dynamics)}
            <span className="ml-4 text-[var(--dawn-30)]">
              {denizen.domain}
            </span>
          </div>

          {/* Description */}
          <p
            className="text-sm leading-relaxed text-[var(--dawn-70)] mb-4"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {denizen.description}
          </p>

          {/* Lore */}
          {denizen.lore && (
            <div
              className="text-sm leading-relaxed text-[var(--dawn-50)] mb-4 pl-4 border-l-2 border-[var(--dawn-15)]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {denizen.lore}
            </div>
          )}

          {/* Features */}
          {denizen.features && denizen.features.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--dawn-08)]">
              <div
                className="text-[9px] tracking-[0.15em] uppercase text-[var(--dawn-30)] mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Features
              </div>
              <div className="flex flex-wrap gap-2">
                {denizen.features.map((feature, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-1 text-[var(--dawn-50)] border border-[var(--dawn-08)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allegiance */}
          <div
            className="mt-4 pt-4 border-t border-[var(--dawn-08)] text-[10px] tracking-[0.1em] text-[var(--dawn-30)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Allegiance: <span className="text-[var(--dawn-50)]">{denizen.allegiance}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
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
