'use client';

import React from 'react';
import { Denizen, DenizenMedia } from '@/lib/types';
import { getMediaPublicUrl } from '@/lib/media';
import Image from 'next/image';

interface FloatingMediaCardsProps {
  denizen: Denizen;
  allMedia: DenizenMedia[];
  currentIndex: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
  floatingCardRefs: React.RefObject<HTMLDivElement>[];
  onSelect?: (index: number) => void;
}

/**
 * FloatingMediaCards - Renders additional media as floating background cards
 * 
 * Performance: Only renders 3-4 visible cards max to save GPU resources
 */
export function FloatingMediaCards({ denizen, allMedia, currentIndex, cardRef, floatingCardRefs, onSelect }: FloatingMediaCardsProps) {
  // Filter out thumbnails and limit to 4 cards for performance
  const displayMedia = allMedia
    .filter(m => m.mediaType !== 'thumbnail')
    .slice(0, 4); // Limit to 4 cards max

  if (displayMedia.length <= 1) return null; // No floating cards if only one media

  // Get positions for floating cards (exclude current index)
  const floatingIndices = displayMedia
    .map((_, idx) => idx)
    .filter(idx => idx !== currentIndex)
    .slice(0, 3); // Max 3 floating cards

  // Helper to resolve media URL
  const resolveMediaUrl = (media: DenizenMedia): string | undefined => {
    const url = getMediaPublicUrl(media.storagePath);
    return url || undefined;
  };

  // Helper to check if media is video
  const isVideo = (media: DenizenMedia): boolean => {
    return media.mediaType === 'video' || 
           media.mimeType?.startsWith('video/') ||
           media.storagePath.match(/\.(mp4|webm|mov|avi|mkv)$/i) != null;
  };

  // Get thumbnail URL for video
  const getThumbnailUrl = (media: DenizenMedia): string | undefined => {
    if (media.mediaType === 'video') {
      // Look for thumbnail in allMedia
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
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none', // Overridden on child cards
        zIndex: 20, // Below blur (35) + main card (50)
      }}
    >
      {floatingIndices.map((mediaIdx, cardIdx) => {
        const media = displayMedia[mediaIdx];
        if (!media) return null;

        const mediaUrl = resolveMediaUrl(media);
        const thumbnailUrl = getThumbnailUrl(media);
        const isVideoMedia = isVideo(media);
        const displayUrl = isVideoMedia && thumbnailUrl ? thumbnailUrl : mediaUrl;

        // Staggered offsets for depth
        const offsetX = -20 - (cardIdx * 20);
        const offsetY = -15 - (cardIdx * 15);
        const rotation = -5 + (cardIdx * 3); // Slight rotation variation
        const zIndex = 40 - (cardIdx * 10); // Decreasing z-index

        if (!displayUrl) return null;

        return (
          <FloatingCard
            key={media.id}
            media={media}
            mediaIdx={mediaIdx}
            cardIdx={cardIdx}
            displayUrl={displayUrl}
            isVideoMedia={isVideoMedia}
            thumbnailUrl={thumbnailUrl}
            offsetX={offsetX}
            offsetY={offsetY}
            rotation={rotation}
            zIndex={zIndex}
            cardRef={floatingCardRefs[cardIdx]}
            onSelect={onSelect ? () => onSelect(mediaIdx) : undefined}
          />
        );
      })}
    </div>
  );
}

// Separate component to handle refs properly
function FloatingCard({
  media,
  mediaIdx,
  cardIdx,
  displayUrl,
  isVideoMedia,
  thumbnailUrl,
  offsetX,
  offsetY,
  rotation,
  zIndex,
  cardRef,
  onSelect,
}: {
  media: DenizenMedia;
  mediaIdx: number;
  cardIdx: number;
  displayUrl: string;
  isVideoMedia: boolean;
  thumbnailUrl: string | undefined;
  offsetX: number;
  offsetY: number;
  rotation: number;
  zIndex: number;
  cardRef: React.RefObject<HTMLDivElement>;
  onSelect?: () => void;
}) {
  return (
    <div
      ref={cardRef}
      className="fixed"
      style={{
        width: '720px',
        maxWidth: '720px',
        aspectRatio: '4/5',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotate(${rotation}deg)`,
        opacity: 0.3 - (cardIdx * 0.05), // Decreasing opacity
        zIndex,
        filter: 'blur(8px)',
        willChange: 'transform',
        pointerEvents: 'auto', // Override parent's pointerEvents: 'none'
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'transform 400ms ease, opacity 400ms ease',
      }}
      onClick={onSelect}
    >
      {/* Card outline - simplified version */}
      <div
        className="relative w-full h-full"
        style={{
          border: '1px solid rgba(236, 227, 214, 0.1)',
          background: 'rgba(5, 4, 3, 0.3)',
          borderRadius: '2px',
        }}
      >
        {/* Media preview - use thumbnail for videos, never autoplay */}
        {isVideoMedia && !thumbnailUrl ? (
          <video
            src={displayUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            style={{ opacity: 0.4 }}
            autoPlay={false}
            controls={false}
          />
        ) : (
          <Image
            src={displayUrl}
            alt=""
            fill
            className="object-cover"
            style={{ opacity: 0.4 }}
            unoptimized
          />
        )}
      </div>
    </div>
  );
}
