'use client';

import { Denizen } from '@/lib/types';
import { getMediaPublicUrl } from '@/lib/media';
import Image from 'next/image';

interface EntityCardProps {
  denizen: Denizen;
  style?: React.CSSProperties;
  onHover?: (denizen: Denizen | null) => void;
  onClick?: (denizen: Denizen) => void;
  onEdit?: (denizen: Denizen) => void;
  isSelected?: boolean;
}

/**
 * EntityCard — Primary card component for displaying denizens in the Atlas constellation
 *
 * Features:
 * - Hover glow with corner bracket accents
 * - Threat level indicator with label reveal
 * - Scanline effect on hover
 * - Connection count dots
 * - Subtle lift animation
 * - Nomenclate allegiance tinting
 */
export function EntityCard({ denizen, style, onHover, onClick, onEdit, isSelected }: EntityCardProps) {

  // Format coordinate for display (removes leading zero)
  const formatCoord = (n: number): string => {
    const sign = n < 0 ? '-' : '';
    return sign + Math.abs(n).toFixed(3).slice(1);
  };

  // Threat level colors
  const threatColors: Record<string, string> = {
    'Benign': 'var(--threat-benign)',
    'Cautious': 'var(--threat-cautious)',
    'Volatile': 'var(--threat-volatile)',
    'Existential': 'var(--threat-existential)',
  };

  const isNomenclate = denizen.allegiance === 'Nomenclate';
  const isExistential = denizen.threatLevel === 'Existential';
  const connectionCount = denizen.connections?.length || 0;

  // Get primary media from uploaded media array
  const primaryMedia = denizen.media?.find(m => m.isPrimary) || denizen.media?.[0];
  // Convert storage path to public URL, handling both relative paths and full URLs
  const getMediaUrl = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    // If it's already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Otherwise convert from storage path
    return getMediaPublicUrl(path) || undefined;
  };
  const mediaUrl = getMediaUrl(primaryMedia?.storagePath) || denizen.image;
  const isVideo = primaryMedia?.mediaType === 'video' || !!denizen.videoUrl;

  return (
    <article
      className={`
        entity-card group cursor-pointer absolute
        ${isSelected ? 'entity-card--selected' : ''}
        ${isNomenclate ? 'entity-card--nomenclate' : ''}
      `}
      style={style}
      onMouseEnter={() => onHover?.(denizen)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(denizen)}
      data-id={denizen.id}
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 70% at 50% 45%, rgba(236, 227, 214, 0.08) 0%, rgba(236, 227, 214, 0.03) 40%, transparent 70%)',
        }}
      />

      {/* Main frame */}
      <div
        className={`
          relative w-[172px] overflow-hidden
          border transition-all duration-250
          group-hover:translate-y-[-2px]
          ${isSelected
            ? 'border-[var(--dawn-50)] shadow-[0_0_0_1px_var(--dawn-15),0_0_30px_rgba(236,227,214,0.1)]'
            : isNomenclate
              ? 'border-[rgba(139,90,90,0.3)] group-hover:border-[rgba(139,90,90,0.5)]'
              : 'border-[var(--dawn-08)] group-hover:border-[var(--dawn-30)]'
          }
          group-hover:shadow-[0_0_0_1px_rgba(236,227,214,0.03),0_20px_50px_-15px_rgba(0,0,0,0.5)]
        `}
        style={{
          background: 'var(--surface-0)',
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        {/* Corner accents */}
        <div
          className={`
            absolute -top-px -left-px w-3 h-3
            border-t border-l border-[var(--dawn-15)]
            transition-opacity duration-300
            ${isSelected ? 'opacity-100 border-[var(--dawn-30)]' : 'opacity-0 group-hover:opacity-100'}
          `}
        />
        <div
          className={`
            absolute -bottom-px -right-px w-3 h-3
            border-b border-r border-[var(--dawn-15)]
            transition-opacity duration-300
            ${isSelected ? 'opacity-100 border-[var(--dawn-30)]' : 'opacity-0 group-hover:opacity-100'}
          `}
        />

        {/* Edit button - appears on hover */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(denizen);
            }}
            className="
              absolute top-2 right-2 z-20
              w-6 h-6 flex items-center justify-center
              opacity-0 group-hover:opacity-100
              border border-[var(--dawn-15)] hover:border-[var(--dawn-50)]
              bg-[var(--surface-0)] hover:bg-[var(--surface-1)]
              text-[var(--dawn-30)] hover:text-[var(--dawn)]
              transition-all duration-200
            "
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
            }}
            title="Edit denizen"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {/* Image container - full bleed */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
          }}
        >
          {/* Full-bleed Media Background */}
          {(isVideo && (denizen.videoUrl || primaryMedia?.storagePath)) || mediaUrl ? (
            <div className="absolute inset-0">
              {isVideo && (denizen.videoUrl || primaryMedia?.storagePath) ? (
                <video
                  src={denizen.videoUrl || getMediaUrl(primaryMedia?.storagePath)}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt={denizen.name}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
                />
              )}
              {/* Gradient overlay for readability */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(5, 4, 3, 0.2) 0%, rgba(5, 4, 3, 0.1) 40%, rgba(5, 4, 3, 0.6) 70%, rgba(5, 4, 3, 0.95) 100%)',
                }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center select-none group-hover:text-[var(--dawn-15)] transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '3.5rem',
                color: 'var(--dawn-08)',
              }}
            >
              {denizen.type[0]}
            </div>
          )}

          {/* Scanlines (appear on hover) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
            }}
          />

          {/* Alien glyphs */}
          <div
            className="absolute top-4 right-4 opacity-40 group-hover:opacity-75 transition-opacity duration-300"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '7px',
              lineHeight: 1.6,
              color: 'var(--dawn-30)',
              letterSpacing: '0.1em',
              writingMode: 'vertical-rl',
            }}
          >
            {denizen.glyphs}
          </div>

          {/* Threat indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-[5px]">
            <div
              className={`
                threat-dot w-[5px] h-[5px] rounded-full opacity-80
                group-hover:scale-[1.2] transition-transform duration-300
                ${isExistential ? 'animate-pulse-threat' : ''}
              `}
              style={{
                background: threatColors[denizen.threatLevel] || 'var(--dawn-30)',
                boxShadow: denizen.threatLevel === 'Volatile' ? '0 0 8px var(--gold-dim)' : 'none',
                borderRadius: '50%',
              }}
              title={denizen.threatLevel}
            />
            <span
              className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-250"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '6px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--dawn-30)',
              }}
            >
              {denizen.threatLevel}
            </span>
          </div>

      {/* Info overlay with glassmorphism */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          paddingLeft: '14px',
          paddingRight: '14px',
          paddingBottom: '16px',
          paddingTop: '12px',
          background: 'rgba(5, 4, 3, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(236, 227, 214, 0.08)',
        }}
      >
            {/* Name */}
            <h3
              className="leading-[1.35] group-hover:text-white transition-colors duration-200"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--dawn)',
              }}
            >
              {denizen.name}
            </h3>

            {/* Subtitle */}
            {denizen.subtitle && (
              <p
                className="mt-0.5 opacity-80"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-50)',
                }}
              >
                {denizen.subtitle}
              </p>
            )}

            {/* Meta row */}
            <div
              className="flex items-center overflow-hidden"
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--dawn-08)',
                columnGap: '16px',
              }}
            >
              <span
                className="shrink-0"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '7px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dawn-30)',
                }}
              >
                {denizen.type}
              </span>

              <div
                className="flex shrink-0"
                style={{
                  columnGap: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '7px',
                  letterSpacing: '0.03em',
                  color: 'var(--dawn-30)',
                }}
              >
                <span className="flex items-center gap-px">
                  <span className="text-[8px] text-[var(--gold)]">◆</span>
                  <span>{formatCoord(denizen.coordinates.geometry)}</span>
                </span>
                <span className="flex items-center gap-px">
                  <span className="text-[8px] text-[var(--dawn-50)]">○</span>
                  <span>{formatCoord(denizen.coordinates.alterity)}</span>
                </span>
                <span className="flex items-center gap-px">
                  <span className="text-[8px] text-[var(--cardinal-dynamics)]">◇</span>
                  <span>{formatCoord(denizen.coordinates.dynamics)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Connection dots */}
          {connectionCount > 0 && (
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              {Array.from({ length: Math.min(connectionCount, 5) }).map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] h-[3px] threat-dot"
                  style={{ background: 'var(--dawn-30)', borderRadius: '50%' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
