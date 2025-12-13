'use client';

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { DenizenMedia } from '@/lib/types';
import { getMediaPublicUrl } from '@/lib/media';
import Image from 'next/image';

interface MediaCarouselProps {
  allMedia: DenizenMedia[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  mainCardWidth: number; // Width of the main card for sizing reference
}

/**
 * MediaCarousel - Horizontal carousel for entity media
 * 
 * Features:
 * - Main card in center, smaller prev/next cards on sides
 * - Arrow buttons for navigation
 * - Scroll wheel navigation
 * - Videos only play when in center position
 */
export function MediaCarousel({ allMedia, currentIndex, onIndexChange, mainCardWidth }: MediaCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Filter out thumbnails
  const displayMedia = allMedia.filter(m => m.mediaType !== 'thumbnail');
  
  if (displayMedia.length <= 1) return null; // No carousel needed for single media
  
  // Calculate side card sizing
  const sideCardScale = 0.6; // 60% of main card size
  const sideCardWidth = mainCardWidth * sideCardScale;
  const gap = 24; // Gap between cards
  
  // Navigation handlers
  const handlePrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + displayMedia.length) % displayMedia.length;
    onIndexChange(prevIndex);
  }, [currentIndex, displayMedia.length, onIndexChange]);
  
  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % displayMedia.length;
    onIndexChange(nextIndex);
  }, [currentIndex, displayMedia.length, onIndexChange]);
  
  // Wheel navigation
  const handleWheel = useCallback((e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal scroll
      e.preventDefault();
      if (e.deltaX > 30) {
        handleNext();
      } else if (e.deltaX < -30) {
        handlePrev();
      }
    } else if (Math.abs(e.deltaY) > 30) {
      // Vertical scroll - also navigate
      e.preventDefault();
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  }, [handleNext, handlePrev]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);
  
  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);
  
  // Get prev and next indices (handle wrapping)
  const prevIndex = (currentIndex - 1 + displayMedia.length) % displayMedia.length;
  const nextIndex = (currentIndex + 1) % displayMedia.length;
  
  // Determine if we should show each side card
  // With 2 items: show both sides (they'll be the same, but that's ok - it shows there's only one other)
  // With 3+ items: show different items on each side
  const showLeftCard = displayMedia.length >= 2;
  const showRightCard = displayMedia.length >= 2;
  // If only 2 items, both sides show the same "other" item
  const leftIndex = prevIndex;
  const rightIndex = displayMedia.length === 2 ? prevIndex : nextIndex;
  
  
  // Helper to check if media is video
  const isVideo = (media: DenizenMedia): boolean => {
    return media.mediaType === 'video' || 
           media.mimeType?.startsWith('video/') ||
           media.storagePath.match(/\.(mp4|webm|mov|avi|mkv)$/i) != null;
  };
  
  // Get thumbnail URL for video
  const getThumbnailUrl = (media: DenizenMedia): string | undefined => {
    if (isVideo(media)) {
      const thumbnail = allMedia.find(
        m => m.mediaType === 'thumbnail' && 
        m.storagePath.includes(media.storagePath.split('/').pop() || '')
      );
      if (thumbnail) {
        return getMediaPublicUrl(thumbnail.storagePath) || undefined;
      }
    }
    return undefined;
  };
  
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 25 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left arrow button */}
      <button
        onClick={handlePrev}
        className="absolute left-4 z-50 pointer-events-auto"
        style={{
          width: '48px',
          height: '48px',
          background: 'rgba(5, 4, 3, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(236, 227, 214, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: isHovering ? 1 : 0.3,
          transition: 'all 200ms ease',
          color: 'rgba(236, 227, 214, 0.7)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(202, 165, 84, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.4)';
          e.currentTarget.style.color = '#CAA554';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(5, 4, 3, 0.6)';
          e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
          e.currentTarget.style.color = 'rgba(236, 227, 214, 0.7)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      
      {/* Right arrow button */}
      <button
        onClick={handleNext}
        className="absolute right-4 z-50 pointer-events-auto"
        style={{
          width: '48px',
          height: '48px',
          background: 'rgba(5, 4, 3, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(236, 227, 214, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: isHovering ? 1 : 0.3,
          transition: 'all 200ms ease',
          color: 'rgba(236, 227, 214, 0.7)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(202, 165, 84, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.4)';
          e.currentTarget.style.color = '#CAA554';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(5, 4, 3, 0.6)';
          e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
          e.currentTarget.style.color = 'rgba(236, 227, 214, 0.7)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      
      {/* Previous card (left side) */}
      {showLeftCard && displayMedia[leftIndex] && (
        <CarouselCard
          key={`left-${leftIndex}-${displayMedia[leftIndex]?.id}`}
          media={displayMedia[leftIndex]}
          position="left"
          width={sideCardWidth}
          gap={gap}
          mainCardWidth={mainCardWidth}
          onClick={handlePrev}
          isVideo={isVideo}
          getThumbnailUrl={getThumbnailUrl}
        />
      )}
      
      {/* Next card (right side) */}
      {showRightCard && displayMedia[rightIndex] && (
        <CarouselCard
          key={`right-${rightIndex}-${displayMedia[rightIndex]?.id}`}
          media={displayMedia[rightIndex]}
          position="right"
          width={sideCardWidth}
          gap={gap}
          mainCardWidth={mainCardWidth}
          onClick={handleNext}
          isVideo={isVideo}
          getThumbnailUrl={getThumbnailUrl}
        />
      )}
      
      {/* Dots indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto"
        style={{ zIndex: 60 }}
      >
        {displayMedia.map((_, idx) => (
          <button
            key={idx}
            onClick={() => onIndexChange(idx)}
            style={{
              width: idx === currentIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: idx === currentIndex 
                ? '#CAA554' 
                : 'rgba(236, 227, 214, 0.3)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (idx !== currentIndex) {
                e.currentTarget.style.background = 'rgba(236, 227, 214, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (idx !== currentIndex) {
                e.currentTarget.style.background = 'rgba(236, 227, 214, 0.3)';
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Side card component - simplified: just show media directly, no loading state
// WHY: Videos auto-play on hover and pause when mouse leaves
function CarouselCard({
  media,
  position,
  width,
  gap,
  mainCardWidth,
  onClick,
  isVideo,
  getThumbnailUrl,
}: {
  media: DenizenMedia;
  position: 'left' | 'right';
  width: number;
  gap: number;
  mainCardWidth: number;
  onClick: () => void;
  isVideo: (media: DenizenMedia) => boolean;
  getThumbnailUrl: (media: DenizenMedia) => string | undefined;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);
  
  const mediaUrl = getMediaPublicUrl(media.storagePath) || undefined;
  const isVideoMedia = isVideo(media);
  const thumbnailUrl = getThumbnailUrl(media);
  
  // Control video playback based on hover state
  // WHY: Videos should auto-play when hovering over the side cards and stop when mouse leaves
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoMedia) return;
    
    if (isCardHovered) {
      video.play().catch(err => {
        // Ignore autoplay errors (browser may block autoplay)
        console.debug('Video autoplay prevented on carousel card:', err);
      });
    } else {
      video.pause();
      video.currentTime = 0; // Reset to beginning when mouse leaves
    }
  }, [isCardHovered, isVideoMedia]);
  
  // Calculate offset from center
  const offsetX = position === 'left' 
    ? -(mainCardWidth / 2 + gap + width / 2) 
    : (mainCardWidth / 2 + gap + width / 2);
  
  if (!mediaUrl) return null;
  
  return (
    <div
      className="absolute pointer-events-auto cursor-pointer"
      style={{
        width: `${width}px`,
        aspectRatio: '4/5',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offsetX}px), -50%) scale(1)`,
        opacity: 0.6,
        transition: 'all 300ms ease',
        zIndex: 30,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        setIsCardHovered(true);
        e.currentTarget.style.opacity = '0.85';
        e.currentTarget.style.transform = `translate(calc(-50% + ${offsetX}px), -50%) scale(1.02)`;
      }}
      onMouseLeave={(e) => {
        setIsCardHovered(false);
        e.currentTarget.style.opacity = '0.6';
        e.currentTarget.style.transform = `translate(calc(-50% + ${offsetX}px), -50%) scale(1)`;
      }}
    >
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          background: '#050403',
          border: '1px solid rgba(236, 227, 214, 0.12)',
          borderRadius: '2px',
        }}
      >
        {/* For videos: show thumbnail when not hovered, video when hovered */}
        {isVideoMedia ? (
          thumbnailUrl ? (
            <>
              {/* Thumbnail (shown when not hovered) */}
              <div 
                className="absolute inset-0 transition-opacity duration-300"
                style={{ opacity: isCardHovered ? 0 : 1 }}
              >
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {/* Video (shown when hovered) */}
              <div 
                className="absolute inset-0 transition-opacity duration-300"
                style={{ opacity: isCardHovered ? 1 : 0 }}
              >
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  preload="auto"
                />
              </div>
            </>
          ) : (
            // Show video element - auto-plays on hover
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
              preload="auto"
            />
          )
        ) : (
          <Image
            src={mediaUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        )}
        
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(5, 4, 3, 0.3) 0%, rgba(5, 4, 3, 0.1) 50%, rgba(5, 4, 3, 0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
