'use client';

import { Denizen } from '@/lib/types';

interface EntityCardProps {
  denizen: Denizen;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function EntityCard({
  denizen,
  style,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: EntityCardProps) {
  return (
    <div
      className="entity-card absolute w-[120px] cursor-pointer transition-all duration-300 ease-out group"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      data-id={denizen.id}
    >
      {/* Glow effect */}
      <div
        className="absolute -inset-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(236, 227, 214, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Card image container */}
      <div
        className="w-full relative overflow-hidden border border-[var(--dawn-15)] group-hover:border-[var(--dawn-30)] transition-colors duration-300"
        style={{ aspectRatio: '3/4', background: 'var(--surface-1)' }}
      >
        {/* Placeholder with type initial */}
        <div
          className="w-full h-full flex items-center justify-center text-2xl text-[var(--dawn-08)]"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
          }}
        >
          {denizen.type[0]}
        </div>

        {/* Alien glyphs */}
        <div
          className="absolute top-2 right-2 text-[8px] text-[var(--dawn-30)] tracking-[0.1em] opacity-60"
          style={{
            fontFamily: 'var(--font-mono)',
            writingMode: 'vertical-rl',
          }}
        >
          {denizen.glyphs}
        </div>

        {/* Info overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 p-2"
          style={{
            background: 'linear-gradient(to top, rgba(5, 4, 3, 0.95) 0%, rgba(5, 4, 3, 0.8) 60%, transparent 100%)',
          }}
        >
          <div
            className="text-[9px] tracking-[0.05em] uppercase text-[var(--dawn)] leading-tight"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {denizen.name}
          </div>
          <div
            className="text-[7px] tracking-[0.08em] uppercase text-[var(--dawn-50)] mt-0.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {denizen.type}
          </div>
        </div>
      </div>

      <style jsx>{`
        .entity-card:hover {
          transform: translate(-50%, -50%) scale(1.08);
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
