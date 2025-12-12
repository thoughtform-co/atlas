'use client';

import { Denizen, DenizenMedia } from '@/lib/types';
import { getMediaPublicUrl } from '@/lib/media';
import Image from 'next/image';

interface EntityCardProps {
  denizen: Denizen;
  style?: React.CSSProperties;
  onHover?: (denizen: Denizen | null) => void;
  onClick?: (denizen: Denizen) => void;
  onEdit?: (denizen: Denizen) => void;
  isSelected?: boolean;
  /** If provided, this card must render this media instead of resolving its own */
  activeMedia?: DenizenMedia;
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
export function EntityCard({ denizen, style, onHover, onClick, onEdit, isSelected, activeMedia }: EntityCardProps) {

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

  // Convert storage path to public URL, handling both relative paths and full URLs
  const getMediaUrl = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    // If it's already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Otherwise convert from storage path
    return getMediaPublicUrl(path) || undefined;
  };
  
  // Get primary media for Constellation view
  // WHY: If activeMedia is provided, use it immediately (for stacked cards)
  // Otherwise, prioritize explicit primary media, then original image field, then first media in array
  // This ensures additional media doesn't replace the original entity image in Constellation view
  const resolvedMedia = activeMedia || (
    denizen.media?.find(m => m.isPrimary) ||
    (denizen.image
      ? denizen.media?.find(m => {
          const mediaUrl = getMediaUrl(m.storagePath);
          return mediaUrl === denizen.image || m.storagePath === denizen.image;
        }) || null
      : denizen.media?.[0])
  );
  
  // Check if media is video based on multiple sources
  const isVideoFromMedia = resolvedMedia?.mediaType === 'video';
  const isVideoFromUrl = !!denizen.videoUrl;
  // Use resolved media if available, otherwise use original image field
  // WHY: This ensures additional media never replaces the original in Constellation view
  const rawMediaUrl = resolvedMedia ? getMediaUrl(resolvedMedia.storagePath) : denizen.image;
  // Check for video extension in URL (handle both full URLs and paths, with or without query params)
  const isVideoFromExtension = rawMediaUrl?.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i) != null;
  const isVideo = isVideoFromMedia || isVideoFromUrl || isVideoFromExtension;
  
  // For card preview, prefer thumbnail for video entities (faster loading, no autoplay)
  // Falls back to video URL if no thumbnail, then to image
  const thumbnailUrl = denizen.thumbnail ? getMediaUrl(denizen.thumbnail) : undefined;
  
  // If we have a thumbnail, prefer it for videos (even if video detection failed)
  // For images: use the raw media URL
  // WHY: If thumbnail exists, it means this is likely a video entity, so use the thumbnail
  const imageUrl = (isVideo && thumbnailUrl) ? thumbnailUrl : (thumbnailUrl && !rawMediaUrl) ? thumbnailUrl : rawMediaUrl;
  // Track if we need to render video instead of image (video without thumbnail)
  const shouldRenderVideo = isVideo && !thumbnailUrl && rawMediaUrl;

  // #region agent log
  if (typeof window !== 'undefined') {
    const logData = {location:'components/constellation/EntityCard.tsx:92',message:'EntityCard thumbnail resolution',data:{denizenId:denizen.id,name:denizen.name,thumbnailRaw:denizen.thumbnail,thumbnailUrl,rawMediaUrl,isVideo,imageUrl,shouldRenderVideo},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'};
    console.log('[DEBUG]', logData);
    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  }
  // #endregion

  // Check if entity has multiple media for stacked hint
  // WHY: Only show stack hint on main card (not on background stacked cards)
  const mediaCount = denizen.media?.filter(m => m.mediaType !== 'thumbnail').length || 0;
  const showStackedHint = !activeMedia && mediaCount > 1 && mediaCount <= 5; // Performance limit: only show if <= 5 media
  const stackedLayers = showStackedHint ? Math.min(3, mediaCount - 1) : 0; // Max 3 stacked hints


  return (
    <article
      className={`
        entity-card group cursor-pointer absolute
        ${isSelected ? 'entity-card--selected' : ''}
        ${isNomenclate ? 'entity-card--nomenclate' : ''}
      `}
      style={style}
      onMouseEnter={!activeMedia ? () => onHover?.(denizen) : undefined}
      onMouseLeave={!activeMedia ? () => onHover?.(null) : undefined}
      onClick={!activeMedia ? () => onClick?.(denizen) : undefined}
      data-id={denizen.id}
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 70% at 50% 45%, rgba(236, 227, 214, 0.08) 0%, rgba(236, 227, 214, 0.03) 40%, transparent 70%)',
        }}
      />

      {/* Stacked cards hint - CSS-only shadows behind main card */}
      {showStackedHint && (
        <>
          {Array.from({ length: stackedLayers }).map((_, layerIdx) => {
            const offset = (layerIdx + 1) * 3; // 3px, 6px, 9px offsets for better visibility
            const rotation = (layerIdx % 2 === 0 ? 1 : -1) * 0.8; // Slightly more rotation: 0.8deg
            const opacity = 0.35 - (layerIdx * 0.08); // More visible: 0.35, 0.27, 0.19
            const borderOpacity = 0.15 - (layerIdx * 0.03); // More visible border: 0.15, 0.12, 0.09
            
            return (
              <div
                key={`stacked-${layerIdx}`}
                className="absolute pointer-events-none"
                style={{
                  width: '200px',
                  aspectRatio: '3/4',
                  left: `${offset}px`,
                  top: `${offset}px`,
                  transform: `rotate(${rotation}deg)`,
                  border: `1px solid rgba(236, 227, 214, ${borderOpacity})`,
                  background: 'var(--surface-0)', // Match main card background
                  opacity,
                  zIndex: -1 - layerIdx,
                  boxShadow: '0 0 0 1px rgba(236, 227, 214, 0.02) inset', // Subtle inner glow
                }}
              />
            );
          })}
        </>
      )}

      {/* Main frame - increased size */}
      <div
        className={`
          relative w-[200px] overflow-hidden
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

        {/* Edit button removed - only available in modal popup */}

        {/* Image container - full bleed */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
          }}
        >
          {/* Full-bleed Media Background */}
          {shouldRenderVideo && rawMediaUrl ? (
            // Video without thumbnail - render video element (muted, no controls for card preview)
            <div className="absolute inset-0">
              <video
                src={rawMediaUrl}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
                autoPlay
                loop
                muted
                playsInline
              />
              {/* Subtle gradient overlay for readability */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(5, 4, 3, 0.1) 0%, transparent 30%, transparent 50%, rgba(5, 4, 3, 0.4) 80%, rgba(5, 4, 3, 0.85) 100%)',
                }}
              />
            </div>
          ) : imageUrl ? (
            // Image or video thumbnail
            <div className="absolute inset-0">
              <Image
                src={imageUrl}
                alt={denizen.name}
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
              />
              {/* Subtle gradient overlay for readability */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(5, 4, 3, 0.1) 0%, transparent 30%, transparent 50%, rgba(5, 4, 3, 0.4) 80%, rgba(5, 4, 3, 0.85) 100%)',
                }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center select-none group-hover:text-[var(--dawn-15)] transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '4rem',
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

      {/* Info overlay with glassmorphism - matching popup style */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          paddingLeft: '14px',
          paddingRight: '14px',
          paddingBottom: '14px',
          paddingTop: '10px',
          background: 'rgba(10, 9, 8, 0.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(236, 227, 214, 0.1)',
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
              {denizen.entityClass || denizen.entityName || denizen.name}
            </h3>

            {/* Subtitle */}
            {denizen.subtitle && (
              <p
                className="mt-1.5 opacity-80"
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
