'use client';

import { Denizen } from '@/lib/types';
import { formatCoordinate } from '@/lib/utils';

interface DetailPanelProps {
  denizen: Denizen | null;
}

export function DetailPanel({ denizen }: DetailPanelProps) {
  return (
    <div
      className={`fixed top-1/2 right-8 -translate-y-1/2 w-80 border border-[var(--dawn-15)] z-50 transition-opacity duration-250 ${
        denizen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        background: 'rgba(10, 9, 8, 0.95)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Image */}
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio: '4/3', background: 'var(--surface-1)' }}
      >
        <div
          className="w-full h-full flex items-center justify-center text-5xl text-[var(--dawn-08)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {denizen?.type[0]}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Type badge */}
        <div
          className="inline-block px-2 py-1 mb-3 text-[9px] tracking-[0.08em] uppercase text-[var(--dawn-70)] border border-[var(--dawn-15)]"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--dawn-04)',
          }}
        >
          {denizen?.type}
        </div>

        {/* Name */}
        <h2
          className="text-base text-[var(--dawn)] mb-2 tracking-[0.02em]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {denizen?.name}
        </h2>

        {/* Coordinates */}
        <div
          className="text-[9px] tracking-[0.1em] text-[var(--dawn-50)] mb-4"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'var(--gold)' }}>◆</span>{' '}
          {denizen && formatCoordinate(denizen.coordinates.geometry)} │{' '}
          <span style={{ color: 'var(--dawn-70)' }}>○</span>{' '}
          {denizen && formatCoordinate(denizen.coordinates.alterity)} │{' '}
          <span style={{ color: 'var(--cardinal-dynamics)' }}>◇</span>{' '}
          {denizen && formatCoordinate(denizen.coordinates.dynamics)}
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed text-[var(--dawn-70)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {denizen?.description}
        </p>

        {/* Glyphs */}
        <div
          className="text-[10px] tracking-[0.2em] text-[var(--dawn-30)] mt-4 pt-3 border-t border-[var(--dawn-08)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {denizen?.glyphs}
        </div>
      </div>
    </div>
  );
}
