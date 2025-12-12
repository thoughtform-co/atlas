'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Denizen } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getMediaPublicUrl } from '@/lib/media';
import { fetchDenizenById } from '@/lib/data';
import { Database } from '@/lib/database.types';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { DenizenCardCanvas, DenizenCardCanvasHandle } from './DenizenCardCanvas';
import { fetchDenizenMedia } from '@/lib/media';
import type { DenizenMedia } from '@/lib/types';
import { MediaCarousel } from './MediaCarousel';
import { LAYOUT } from '@/lib/constants';

type DenizenMediaInsert = Database['public']['Tables']['denizen_media']['Insert'];

interface DenizenModalV3Props {
  denizen: Denizen | null;
  onClose: () => void;
  onNavigate?: (denizenId: string) => void;
  allDenizens?: Denizen[];
  onDenizenUpdate?: (updatedDenizen: Denizen) => void;
}

// Design system colors
const GOLD = { r: 202, g: 165, b: 84 };
const DYNAMICS = { r: 91, g: 138, b: 122 };
const VOLATILE = { r: 193, g: 127, b: 89 };
const DAWN = { r: 236, g: 227, b: 214 };
const GRID = 3;

export function DenizenModalV3({ denizen, onClose, onDenizenUpdate }: DenizenModalV3Props) {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentDenizen, setCurrentDenizen] = useState<Denizen | null>(denizen);
  const [isExporting, setIsExporting] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [allMedia, setAllMedia] = useState<DenizenMedia[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const closeMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canvasCardRef = useRef<DenizenCardCanvasHandle>(null);

  // Update currentDenizen when denizen prop changes
  useEffect(() => {
    setCurrentDenizen(denizen);
  }, [denizen]);

  // Fetch all media when denizen.id changes (primitive dependency, not object)
  // WHY: Using denizen?.id instead of denizen object prevents effect from running when object reference changes
  // Sentinel: Primitive dependencies prevent unnecessary re-runs
  useEffect(() => {
    const denizenId = denizen?.id;
    if (!denizenId) {
      setAllMedia([]);
      setCurrentMediaIndex(0);
      return;
    }

    // WHY: Async function to load media - must be defined inside effect to access denizenId
    // Sentinel: Null check narrowing - capture denizenId before async operations
    const loadMedia = async () => {
      try {
        const media = await fetchDenizenMedia(denizenId);
        let filteredMedia = media.filter(m => m.mediaType !== 'thumbnail');

        // If denizen.image exists and isn't in fetched media, create virtual legacy media
        // WHY: Ensures backwards compatibility with entities that only have denizen.image
        if (denizen?.image) {
          const legacyUrl = getMediaPublicUrl(denizen.image) || denizen.image;

          const hasOriginal = filteredMedia.some(m => {
            const mUrl = getMediaPublicUrl(m.storagePath);
            return mUrl === legacyUrl || m.storagePath === denizen.image;
          });

          if (!hasOriginal) {
            const isLegacyVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(denizen.image);

            const virtualMedia: DenizenMedia = {
              id: `legacy-${denizen.id}`,
              denizenId: denizen.id,
              mediaType: isLegacyVideo ? 'video' : 'image',
              storagePath: denizen.image,
              fileName: 'Original Manifestation',
              displayOrder: -1,
              isPrimary: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            filteredMedia = [virtualMedia, ...filteredMedia];
          }
        }

        setAllMedia(filteredMedia);

        // Find primary media index
        // WHY: Primary media should be shown first when modal opens
        const primaryIndex = filteredMedia.findIndex(m => m.isPrimary);
        setCurrentMediaIndex(primaryIndex >= 0 ? primaryIndex : 0);
      } catch (error) {
        console.error('Error fetching media:', error);
        setAllMedia([]);
        setCurrentMediaIndex(0);
      }
    };

    loadMedia();
  }, [denizen?.id]);

  useEffect(() => {
    if (!denizen) return;
    const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [denizen]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);


  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Handle additional media upload
  // WHY: Allows admins to add extra images/videos to entities after creation
  // Sentinel: Null check narrowing - capture supabase and denizen in const before await
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const client = supabase;
    const currentDenizen = denizen;
    if (!client || !currentDenizen || !e.target.files?.length) return;
    
    setIsUploading(true);
    setUploadError(null);

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentDenizen.id}/${Date.now()}.${fileExt}`;

    try {
      // Upload to storage
      const { error: uploadError } = await client.storage
        .from('denizen-media')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = client.storage
        .from('denizen-media')
        .getPublicUrl(fileName);

      // Get existing media count to set display_order
      // WHY: display_order determines the sequence of media in the modal view
      const existingMediaCount = allMedia.filter(m => m.mediaType !== 'thumbnail').length;
      
      const mediaInsert: DenizenMediaInsert = {
        denizen_id: currentDenizen.id,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        storage_path: fileName,  // Store relative path, not full URL
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: existingMediaCount, // Set order based on existing count
        is_primary: false, // Additional media is never primary
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (client as any).from('denizen_media').insert(mediaInsert);
      if (dbError) throw dbError;

      // Refetch the denizen with updated media from database
      // Sentinel: Null check narrowing - capture result before await
      const updatedDenizen = await fetchDenizenById(currentDenizen.id);
      if (updatedDenizen) {
        setCurrentDenizen(updatedDenizen);
        // Notify parent component of the update
        onDenizenUpdate?.(updatedDenizen);
      }
      
      // Reload media list
      // WHY: Refresh allMedia state to include the newly uploaded media
      const media = await fetchDenizenMedia(currentDenizen.id);
      const filteredMedia = media.filter(m => m.mediaType !== 'thumbnail');
      setAllMedia(filteredMedia);

      // Update local state to show the uploaded media immediately
      setUploadedMedia({
        url: publicUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image'
      });
      setUploadSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Use currentDenizen (which may be updated after upload) or fallback to denizen prop
  const displayDenizen = currentDenizen || denizen;
  
  // Generate manifestation-varied coordinates for additional media
  // WHY: Each additional media represents a different manifestation of the same entity
  // The parameters should be related but slightly different
  // NOTE: Must be called before early return to comply with Rules of Hooks
  const getManifestationCoords = useMemo(() => {
    if (!displayDenizen) {
      return { geometry: 0, alterity: 0, dynamics: 0 };
    }
    if (currentMediaIndex === 0) {
      // Primary media uses original coordinates
      return displayDenizen.coordinates;
    }
    
    // Use media index as seed for deterministic variation
    // Each manifestation has slightly different readings
    const seed = currentMediaIndex * 0.1;
    const variation = (base: number, offset: number) => {
      // Create subtle variation (-0.15 to +0.15) based on seed
      const delta = Math.sin(seed * 7 + offset) * 0.15;
      return Math.max(-1, Math.min(1, base + delta)); // Clamp to -1..1
    };
    
    return {
      geometry: variation(displayDenizen.coordinates.geometry, 1),
      alterity: variation(displayDenizen.coordinates.alterity, 2),
      dynamics: variation(displayDenizen.coordinates.dynamics, 3),
    };
  }, [displayDenizen?.coordinates, currentMediaIndex]);

  if (!displayDenizen) return null;

  // Handle edit navigation
  const handleEdit = () => {
    router.push(`/admin/edit/${displayDenizen.id}`);
  };

  // Handle media selection from floating cards
  // WHY: Allows clicking floating cards to promote them to main card with carousel animation
  const handleMediaSelect = (index: number) => {
    if (index === currentMediaIndex) return;
    setAnimatingIndex(index);
    // Brief delay for out-animation before switching
    setTimeout(() => {
      setCurrentMediaIndex(index);
      setAnimatingIndex(null);
    }, 200);
  };

  // Handle media navigation
  const handleNextMedia = () => {
    if (allMedia.length > 0) {
      const filteredMedia = allMedia.filter(m => m.mediaType !== 'thumbnail');
      const nextIndex = (currentMediaIndex + 1) % filteredMedia.length;
      handleMediaSelect(nextIndex);
    }
  };

  const handlePrevMedia = () => {
    if (allMedia.length > 0) {
      const filteredMedia = allMedia.filter(m => m.mediaType !== 'thumbnail');
      const prevIndex = (currentMediaIndex - 1 + filteredMedia.length) % filteredMedia.length;
      handleMediaSelect(prevIndex);
    }
  };

  const signalStrength = ((getManifestationCoords.geometry + 1) / 2).toFixed(3);
  const epoch = displayDenizen.firstObserved || '4.2847';
  const tempValue = ((getManifestationCoords.dynamics + 1) / 2).toFixed(2);
  const hallucinationScore = Math.round((getManifestationCoords.dynamics + 1) * 2.5);

  // Helper to convert storage path to public URL
  const resolveMediaUrl = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    // If it's already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Otherwise convert from storage path
    return getMediaPublicUrl(path) || undefined;
  };

  // Get current media from allMedia array, or fallback to denizen's existing media
  // WHY: Prioritize explicit primary, then original image field, then first in array
  // This ensures additional media doesn't replace the original in the modal
  const currentMedia = allMedia.length > 0 && currentMediaIndex < allMedia.length 
    ? allMedia[currentMediaIndex]
    : (displayDenizen.media?.find(m => m.isPrimary) || 
       (displayDenizen.image ? 
         displayDenizen.media?.find(m => {
           const mediaUrl = resolveMediaUrl(m.storagePath);
           return mediaUrl === displayDenizen.image || m.storagePath === displayDenizen.image;
         }) || null :
         displayDenizen.media?.[0]));
  
  // Use uploaded media if available, otherwise use current media from allMedia, then fallback to original image
  // WHY: Always prefer the original image field if no media array match is found
  const mediaUrl = uploadedMedia?.url || 
                   (currentMedia ? resolveMediaUrl(currentMedia.storagePath) : null) || 
                   displayDenizen.image;
  
  // Get thumbnail URL (for video entities)
  const thumbnailUrl = displayDenizen.thumbnail ? resolveMediaUrl(displayDenizen.thumbnail) : undefined;
  
  // Check if media is video based on multiple sources
  const isVideoFromMedia = uploadedMedia?.type === 'video' || currentMedia?.mediaType === 'video';
  const isVideoFromUrl = displayDenizen.videoUrl != null;
  // Also check file extension of image field (for entities created before denizen_media table)
  const isVideoFromExtension = mediaUrl?.match(/\.(mp4|webm|mov|avi|mkv)$/i) != null;
  const isVideo = isVideoFromMedia || isVideoFromUrl || isVideoFromExtension;

  // Export card as PNG
  const handleExportPNG = async () => {
    if (canvasCardRef.current) {
      // Use canvas-based export
      setIsExporting(true);
      try {
        canvasCardRef.current.exportPNG();
      } catch (error) {
        console.error('Failed to export PNG:', error);
        alert('Failed to export PNG.');
      } finally {
        setIsExporting(false);
      }
      return;
    }
    
    // Fallback to html2canvas if canvas not available
    if (!cardRef.current) return;
    
    setIsExporting(true);
    
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:start',message:'PNG export started',data:{isVideo,hasThumbnail:!!thumbnailUrl,thumbnailUrl,hasVideoRef:!!videoRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-1'})}).catch(()=>{});
    }
    // #endregion
    
    // Elements to restore after capture
    let videoElement: HTMLVideoElement | null = null;
    let frameImg: HTMLImageElement | null = null;
    let originalVideoDisplay = '';
    
    try {
      const video = videoRef.current;
      const card = cardRef.current;
      
      // Get exact card dimensions for proper capture
      const cardRect = card.getBoundingClientRect();
      
      // For videos: use thumbnail if available, otherwise capture current frame
      if (isVideo && video) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:video-handling',message:'Processing video for PNG',data:{hasThumbnail:!!thumbnailUrl,thumbnailUrl,videoWidth:video.videoWidth,videoHeight:video.videoHeight},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-2'})}).catch(()=>{});
        }
        // #endregion
        video.pause();
        videoElement = video;
        originalVideoDisplay = video.style.display;
        
        try {
          let imageSrc: string | null = null;
          
          // Prefer thumbnail URL if available
          if (thumbnailUrl) {
            imageSrc = thumbnailUrl;
          } else {
            // Fallback: try to capture current video frame
            // Note: This may fail due to CORS if video is from external source
            // Ensure video has loaded metadata
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              try {
                // Try to capture frame - this may fail due to CORS
                const frameCanvas = document.createElement('canvas');
                frameCanvas.width = video.videoWidth;
                frameCanvas.height = video.videoHeight;
                const ctx = frameCanvas.getContext('2d', { willReadFrequently: true });
                
                if (ctx) {
                  // Set crossOrigin to anonymous to avoid CORS issues
                  if (video.crossOrigin !== 'anonymous') {
                    video.crossOrigin = 'anonymous';
                  }
                  
                  ctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
                  imageSrc = frameCanvas.toDataURL('image/jpeg', 0.95);
                  // #region agent log
                  if (typeof window !== 'undefined') {
                    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:frame-captured',message:'Video frame captured successfully',data:{frameWidth:frameCanvas.width,frameHeight:frameCanvas.height,dataUrlLength:imageSrc.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-6'})}).catch(()=>{});
                  }
                  // #endregion
                }
              } catch (e) {
                // #region agent log
                if (typeof window !== 'undefined') {
                  fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:frame-capture-error',message:'Video frame capture failed (CORS or other)',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-7'})}).catch(()=>{});
                }
                // #endregion
                console.warn('Could not capture video frame (may be CORS issue):', e);
                // If frame capture fails, we'll let html2canvas try to capture the video directly
                // Don't set imageSrc, so we skip the image insertion and let html2canvas handle it
              }
            } else {
              // #region agent log
              if (typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:video-not-ready',message:'Video not ready for frame capture',data:{readyState:video.readyState,videoWidth:video.videoWidth,videoHeight:video.videoHeight},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-8'})}).catch(()=>{});
              }
              // #endregion
            }
          }
          
          if (imageSrc) {
            // #region agent log
            if (typeof window !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:image-insert',message:'Inserting thumbnail/frame image',data:{imageSrcType:thumbnailUrl?'thumbnail':'frame',imageSrcLength:imageSrc.length,hasParent:!!video.parentElement},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-3'})}).catch(()=>{});
            }
            // #endregion
            // Create an img element with the thumbnail/frame
            frameImg = document.createElement('img');
            frameImg.src = imageSrc;
            frameImg.crossOrigin = 'anonymous';
            // Match exact video styling for full-bleed coverage
            frameImg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
            
            // Hide video and insert frame image BEFORE the video (so it's in same position)
            video.style.display = 'none';
            video.parentElement?.insertBefore(frameImg, video);
            
            // Wait for image to load
            await new Promise<void>((resolve) => {
              if (frameImg) {
                frameImg.onload = () => {
                  // #region agent log
                  if (typeof window !== 'undefined' && frameImg) {
                    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:image-loaded',message:'Thumbnail/frame image loaded',data:{imageWidth:frameImg.width,imageHeight:frameImg.height},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-4'})}).catch(()=>{});
                  }
                  // #endregion
                  resolve();
                };
                frameImg.onerror = () => {
                  // #region agent log
                  if (typeof window !== 'undefined') {
                    fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:image-error',message:'Thumbnail/frame image failed to load',data:{imageSrc},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-5'})}).catch(()=>{});
                  }
                  // #endregion
                  resolve(); // Resolve even on error to not block
                };
                // Ensure we wait long enough for render
                setTimeout(() => resolve(), 500);
              } else {
                resolve();
              }
            });
          }
        } catch (e) {
          console.warn('Could not capture video frame:', e);
        }
      }
      
      // Use html2canvas with exact dimensions - capture only the card content
      // Calculate exact card dimensions (including border)
      const computedStyle = window.getComputedStyle(card);
      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
      const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
      
      // Card's content dimensions (excluding border)
      const cardContentWidth = cardRect.width - borderLeft - borderRight;
      const cardContentHeight = cardRect.height - borderTop - borderBottom;
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:dimensions',message:'Card dimensions calculated',data:{cardRectWidth:cardRect.width,cardRectHeight:cardRect.height,cardContentWidth,cardContentHeight,borderLeft,borderRight,borderTop,borderBottom},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-B1'})}).catch(()=>{});
      }
      // #endregion
      
      const canvas = await html2canvas(card, {
        backgroundColor: '#050403', // Match card background exactly
        scale: 2,
        logging: false,
        useCORS: true,
        width: cardRect.width, // Include border in capture
        height: cardRect.height,
        windowWidth: cardRect.width,
        windowHeight: cardRect.height,
        x: cardRect.left, // Use absolute position to capture exactly this element
        y: cardRect.top,
        foreignObjectRendering: false,
        allowTaint: false,
        removeContainer: false, // Don't remove container, we want the border
        onclone: (clonedDoc) => {
          // If we have a frame image, ensure video is hidden
          if (frameImg && video) {
            const clonedVideo = clonedDoc.querySelector('video');
            if (clonedVideo) {
              clonedVideo.style.display = 'none';
            }
          } else if (video && !frameImg) {
            // If frame capture failed, try to ensure video is visible and has crossOrigin
            const clonedVideo = clonedDoc.querySelector('video');
            if (clonedVideo) {
              clonedVideo.crossOrigin = 'anonymous';
              clonedVideo.style.display = '';
            }
          }
        },
      });
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportPNG:canvas-captured',message:'Canvas captured',data:{canvasWidth:canvas.width,canvasHeight:canvas.height,expectedWidth:cardRect.width*2,expectedHeight:cardRect.height*2},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PNG-B2'})}).catch(()=>{});
      }
      // #endregion
      
      // Download directly - no need for final canvas since we set backgroundColor
      const link = document.createElement('a');
      const displayName = (displayDenizen.entityClass || displayDenizen.name).toLowerCase().replace(/\s+/g, '-');
      link.download = `${displayName}-atlas-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. The media may be from an external source.');
    } finally {
      // Restore DOM
      if (frameImg) {
        frameImg.remove();
      }
      if (videoElement) {
        videoElement.style.display = originalVideoDisplay;
        videoElement.play();
      }
      setIsExporting(false);
    }
  };

  // Export card as MP4 video (records one full animation cycle - 12 seconds)
  const handleExportVideo = async () => {
    if (canvasCardRef.current) {
      // Use canvas-based export
      setIsRecordingVideo(true);
      setRecordingProgress(0);
      setShowDownloadMenu(false);
      try {
        await canvasCardRef.current.exportVideo();
      } catch (error) {
        console.error('Failed to export video:', error);
        alert('Failed to export video. Your browser may not support video recording.');
      } finally {
        setIsRecordingVideo(false);
        setRecordingProgress(0);
      }
      return;
    }
    
    // Fallback to html2canvas/MediaRecorder if canvas not available
    if (!cardRef.current) return;
    
    setIsRecordingVideo(true);
    setRecordingProgress(0);
    setShowDownloadMenu(false);
    
    const card = cardRef.current;
    const cardRect = card.getBoundingClientRect();
    const duration = 12000; // 12 seconds for one full scan cycle
    const fps = 24;
    const frameInterval = 1000 / fps;
    const totalFrames = Math.ceil(duration / frameInterval);
    
    // Ensure video is playing if it exists
    const video = videoRef.current;
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:start',message:'Video export started',data:{isVideo,hasVideo:!!video,videoReadyState:video?.readyState,videoWidth:video?.videoWidth,videoHeight:video?.videoHeight,videoPaused:video?.paused},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-1'})}).catch(()=>{});
    }
    // #endregion
    if (isVideo && video) {
      // Ensure video is playing and ready
      if (video.paused) {
        video.play().catch((e) => {
          console.warn('Could not play video for recording:', e);
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:play-error',message:'Video play failed',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-2'})}).catch(()=>{});
          }
          // #endregion
        });
      }
      // Wait a bit for video to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      // Create a canvas for recording
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = cardRect.width * 2; // 2x scale for quality
      recordCanvas.height = cardRect.height * 2;
      const recordCtx = recordCanvas.getContext('2d');
      
      if (!recordCtx) {
        throw new Error('Could not create canvas context');
      }
      
      // Setup MediaRecorder - use WebM (MP4 not widely supported by MediaRecorder API)
      const stream = recordCanvas.captureStream(fps);
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder not supported in this browser');
      }
      
      // Try MP4 (H.264) first for better compatibility, fallback to WebM
      // Note: MP4 support in MediaRecorder is limited to Chrome/Edge and may not work in all cases
      let mimeType = 'video/mp4';
      let fileExtension = 'mp4';
      let mp4Supported = false;
      
      // Check for MP4 support with H.264 codec
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mp4Supported = true;
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4; codecs=avc1.42E01E')) {
        mp4Supported = true;
        mimeType = 'video/mp4; codecs=avc1.42E01E';
      } else {
        // Fallback to WebM
        mimeType = 'video/webm;codecs=vp9';
        fileExtension = 'webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:mime-type',message:'MimeType selection',data:{mimeType,fileExtension,mp4Supported},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-3'})}).catch(()=>{});
      }
      // #endregion
      
      // Try to create MediaRecorder with selected mimeType, fallback to WebM if it fails
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 8000000, // 8 Mbps for good quality
        });
      } catch (e) {
        // If MP4 fails, fallback to WebM
        if (mp4Supported) {
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:mp4-fallback',message:'MP4 creation failed, falling back to WebM',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-8'})}).catch(()=>{});
          }
          // #endregion
          mimeType = 'video/webm;codecs=vp9';
          fileExtension = 'webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 8000000,
          });
        } else {
          throw e; // Re-throw if it wasn't an MP4 attempt
        }
      }
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const displayName = (displayDenizen.entityClass || displayDenizen.name).toLowerCase().replace(/\s+/g, '-');
        link.download = `${displayName}-atlas-card.${fileExtension}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsRecordingVideo(false);
        setRecordingProgress(0);
      };
      
      mediaRecorder.start();
      
      // Record frames
      const startTime = performance.now();
      let frameCount = 0;
      
      const captureFrame = async () => {
        const elapsed = performance.now() - startTime;
        
        if (elapsed >= duration) {
          mediaRecorder.stop();
          return;
        }
        
        try {
          // Clear canvas with card background
          recordCtx.fillStyle = '#050403';
          recordCtx.fillRect(0, 0, recordCanvas.width, recordCanvas.height);
          
          // Draw the current video frame first (as background)
          // html2canvas cannot reliably capture <video> elements, so we must draw it manually
          if (isVideo && video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            try {
              // Draw current video frame scaled to canvas (cover mode to match card styling)
              recordCtx.drawImage(
                video,
                0, 0, video.videoWidth, video.videoHeight,
                0, 0, recordCanvas.width, recordCanvas.height
              );
              // #region agent log
              if (frameCount < 3 && typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:video-drawn',message:'Video frame drawn to canvas',data:{videoWidth:video.videoWidth,videoHeight:video.videoHeight,canvasWidth:recordCanvas.width,canvasHeight:recordCanvas.height,readyState:video.readyState,frameCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-4'})}).catch(()=>{});
              }
              // #endregion
            } catch (e) {
              console.warn('Could not draw video frame:', e);
              // #region agent log
              if (frameCount < 3 && typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:video-draw-error',message:'Video frame draw failed',data:{error:String(e),readyState:video.readyState,frameCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-5'})}).catch(()=>{});
              }
              // #endregion
            }
          }
          
          // Now capture the UI elements (parameter panels, text, animations) with html2canvas
          // We exclude the video element since we've already drawn it manually
          const frameCanvas = await html2canvas(card, {
            backgroundColor: 'transparent', // Transparent so video shows through
            scale: 2,
            logging: false,
            useCORS: true,
            width: cardRect.width,
            height: cardRect.height,
            x: cardRect.left,
            y: cardRect.top,
            ignoreElements: (element) => {
              // Ignore video element - we're drawing it manually
              if (element.tagName === 'VIDEO') return true;
              return false;
            },
            onclone: (clonedDoc) => {
              // Hide video element in cloned DOM since we're drawing it manually
              const clonedVideo = clonedDoc.querySelector('video');
              if (clonedVideo) {
                clonedVideo.style.display = 'none';
                // Make the parent container (media background div) transparent
                const parent = clonedVideo.parentElement;
                if (parent instanceof HTMLElement) {
                  parent.style.backgroundColor = 'transparent';
                  parent.style.background = 'none';
                }
              }
              // Make card background transparent so video shows through
              const clonedCard = clonedDoc.querySelector('[data-atlas-card="true"]');
              if (clonedCard instanceof HTMLElement) {
                clonedCard.style.backgroundColor = 'transparent';
                clonedCard.style.background = 'none';
              }
            },
          });
          
          // Composite UI elements on top of the video background
          recordCtx.globalCompositeOperation = 'source-over';
          recordCtx.drawImage(frameCanvas, 0, 0, recordCanvas.width, recordCanvas.height);
          
          // #region agent log
          if (frameCount < 3 && typeof window !== 'undefined') {
            // Check if video is visible by sampling a pixel from the canvas
            const imageData = recordCtx.getImageData(recordCanvas.width / 2, recordCanvas.height / 2, 1, 1);
            const pixel = imageData.data;
            fetch('http://127.0.0.1:7242/ingest/6d1c01a6-e28f-42e4-aca5-d93649a488e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DenizenModalV3.tsx:handleExportVideo:frame-composited',message:'Frame composited (video + UI)',data:{centerPixel:[pixel[0],pixel[1],pixel[2],pixel[3]],isDark:pixel[0]<10&&pixel[1]<10&&pixel[2]<10,frameCount,canvasWidth:frameCanvas.width,canvasHeight:frameCanvas.height},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'VID-7'})}).catch(()=>{});
          }
          // #endregion
          
          frameCount++;
          setRecordingProgress(Math.round((elapsed / duration) * 100));
          
          // Schedule next frame
          const nextFrameTime = frameCount * frameInterval;
          const delay = Math.max(0, nextFrameTime - (performance.now() - startTime));
          setTimeout(captureFrame, delay);
        } catch (e) {
          console.warn('Frame capture error:', e);
          // Continue recording despite errors
          setTimeout(captureFrame, frameInterval);
        }
      };
      
      // Start capturing
      captureFrame();
      
    } catch (error) {
      console.error('Failed to export video:', error);
      alert('Failed to export video. Your browser may not support video recording.');
      setIsRecordingVideo(false);
      setRecordingProgress(0);
    }
  };


  return (
    <>
      <style>{`
        .denizen-description-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .denizen-description-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .denizen-description-scroll::-webkit-scrollbar-thumb {
          background: rgba(236, 227, 214, 0.08);
          border-radius: 3px;
        }
        .denizen-description-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 227, 214, 0.15);
        }
      `}</style>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ 
        // Account for nav bar - position modal below it
        top: `${LAYOUT.NAV_HEIGHT}px`,
        padding: `${LAYOUT.MODAL_PADDING}px`, 
        background: 'rgba(5, 4, 3, 0.95)', 
        backdropFilter: 'blur(20px)' 
      }}
    >
      {/* Hidden canvas component for export */}
      {/* WHY no visibility:hidden: Browser throttles requestAnimationFrame for hidden elements,
          preventing the canvas from rendering. Position off-screen is sufficient to hide it. */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <DenizenCardCanvas
          ref={canvasCardRef}
          denizen={displayDenizen}
          mediaUrl={mediaUrl}
          thumbnailUrl={thumbnailUrl}
          isVideo={isVideo}
          elapsedTime={elapsedTime}
        />
      </div>
      
      {/* Media Carousel - horizontal side cards with navigation */}
      {allMedia.filter(m => m.mediaType !== 'thumbnail').length > 1 && (
        <MediaCarousel
          allMedia={allMedia}
          currentIndex={currentMediaIndex}
          onIndexChange={handleMediaSelect}
          mainCardWidth={720} // Match main card max width
        />
      )}

      {/* Depth overlay - removed blur, using z-axis depth instead */}

      {/* Card — 4:5 Aspect */}
      {/* Responsive sizing: Card scales down on smaller screens while maintaining aspect ratio.
          Max height ensures card never exceeds viewport minus nav bar and padding.
          Width follows aspect ratio: when height is constrained, width shrinks proportionally. */}
      <div
        ref={cardRef}
        data-atlas-card="true"
        className="relative overflow-hidden"
        style={{
          // Let aspect ratio and max constraints determine size
          // Height is primary constraint on small screens, width on large screens
          width: `min(calc((100vh - ${LAYOUT.NAV_HEIGHT}px - ${LAYOUT.MODAL_PADDING * 2}px) * 0.8), 720px)`,
          maxWidth: `calc(100vw - ${LAYOUT.MODAL_PADDING * 2}px)`,
          aspectRatio: '4/5',
          background: '#050403',
          display: 'grid',
          gridTemplateColumns: '150px 1fr 150px',
          gridTemplateRows: '32px 1fr 110px',
          gap: '1px',
          border: '1px solid rgba(236, 227, 214, 0.08)',
          zIndex: 50, // Main card on top
          transform: animatingIndex !== null
            ? 'translateZ(-30px) rotateY(10deg)'
            : 'translateZ(0) rotateY(0deg)',
          transition: 'transform 300ms ease, opacity 300ms ease',
        }}
      >
        {/* Full-bleed Media Background */}
        {mediaUrl && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {isVideo ? (
              <video
                key={currentMedia?.id ?? displayDenizen.id}
                ref={videoRef}
                src={displayDenizen.videoUrl || mediaUrl}
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <Image
                src={mediaUrl}
                alt={displayDenizen.entityClass || displayDenizen.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            )}
            {/* Gradient overlay for readability */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(5, 4, 3, 0.4) 0%, rgba(5, 4, 3, 0.2) 50%, rgba(5, 4, 3, 0.6) 100%)',
            }} />
          </div>
        )}
        {/* Scan Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(to bottom, rgba(202, 165, 84, 0.4), transparent)',
            zIndex: 100,
            animation: 'scan 12s linear infinite',
            pointerEvents: 'none',
          }}
        />
        <style jsx global>{`
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            5% { opacity: 0.6; }
            95% { opacity: 0.6; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>

        {/* Header - glassmorphism */}
        <div
          style={{
            gridColumn: '1 / -1',
            position: 'relative',
            zIndex: 10,
            background: 'rgba(10, 9, 8, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '9px',
            letterSpacing: '0.1em',
            gap: '16px',
            borderBottom: '1px solid rgba(236, 227, 214, 0.12)',
          }}
        >
          <span style={{ color: '#CAA554', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            ATLAS RESEARCH
          </span>
          <span style={{ color: 'rgba(236, 227, 214, 0.3)', fontFamily: 'var(--font-mono)' }}>
            MODE: <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>ACTIVE SCAN</span>
          </span>
          <span style={{ color: 'rgba(236, 227, 214, 0.3)', fontFamily: 'var(--font-mono)' }}>
            SIG: <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{signalStrength}</span>
          </span>
          
          {/* Right side: Epoch, Time, then action buttons */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'rgba(236, 227, 214, 0.3)', fontFamily: 'var(--font-mono)' }}>
              EPOCH: <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{epoch}</span>
            </span>
            <span style={{ color: 'rgba(236, 227, 214, 0.3)', fontFamily: 'var(--font-mono)' }}>
              [<span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{formatTime(elapsedTime)}</span>]
            </span>
            
            {/* Media navigation (if multiple media) */}
            {allMedia.filter(m => m.mediaType !== 'thumbnail').length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                <button
                  onClick={handlePrevMedia}
                  title="Previous media"
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(236, 227, 214, 0.5)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)'}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <span style={{ 
                  color: 'rgba(236, 227, 214, 0.4)', 
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  minWidth: '30px',
                  textAlign: 'center',
                }}>
                  {currentMediaIndex + 1} / {allMedia.filter(m => m.mediaType !== 'thumbnail').length}
                </span>
                <button
                  onClick={handleNextMedia}
                  title="Next media"
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(236, 227, 214, 0.5)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)'}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            
            {/* Action buttons - consistent sizing, tighter spacing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              {/* Add Media button (admin only) */}
              {isAdmin && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Add media"
                    style={{
                      background: 'none',
                      border: 'none',
                      width: '24px',
                      height: '24px',
                      padding: 0,
                      cursor: isUploading ? 'wait' : 'pointer',
                      color: 'rgba(236, 227, 214, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isUploading) e.currentTarget.style.color = '#CAA554';
                    }}
                    onMouseLeave={(e) => {
                      if (!isUploading) e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Edit button (admin only) */}
              {isAdmin && (
                <button
                  onClick={handleEdit}
                  title="Edit entity"
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '24px',
                    height: '24px',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'rgba(236, 227, 214, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CAA554'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
              
              {/* Download button with dropdown */}
              <div 
                ref={downloadMenuRef}
                style={{ position: 'relative' }}
              >
                <button
                  ref={downloadButtonRef}
                  disabled={isExporting || isRecordingVideo}
                  title="Download"
                  onMouseEnter={() => {
                    if (!isExporting && !isRecordingVideo && downloadButtonRef.current) {
                      if (closeMenuTimeoutRef.current) {
                        clearTimeout(closeMenuTimeoutRef.current);
                        closeMenuTimeoutRef.current = null;
                      }
                      const rect = downloadButtonRef.current.getBoundingClientRect();
                      const dropdownWidth = 140; // minWidth from styles
                      const position = {
                        top: rect.bottom + 4,
                        left: Math.max(8, rect.right - dropdownWidth), // clamp to viewport
                      };
                      setMenuPosition(position);
                      setShowDownloadMenu(true);
                      setIsMenuHovered(true);
                    }
                  }}
                  onMouseLeave={(e) => {
                    const relatedTarget = e.relatedTarget;
                    if (relatedTarget && relatedTarget instanceof HTMLElement) {
                      const menuElement = relatedTarget.closest('[data-download-menu]');
                      if (menuElement) return;
                    }
                    setIsMenuHovered(false);
                    if (closeMenuTimeoutRef.current) clearTimeout(closeMenuTimeoutRef.current);
                    closeMenuTimeoutRef.current = setTimeout(() => {
                      if (!isMenuHovered) setShowDownloadMenu(false);
                    }, 120);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '24px',
                    height: '24px',
                    padding: 0,
                    cursor: (isExporting || isRecordingVideo) ? 'wait' : 'pointer',
                    color: (isExporting || isRecordingVideo) ? '#CAA554' : 'rgba(236, 227, 214, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 150ms ease',
                  }}
                >
                  {isRecordingVideo ? (
                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>{recordingProgress}%</span>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </button>
                
                {/* Dropdown menu - using fixed position to escape stacking context */}
                {showDownloadMenu && !isExporting && !isRecordingVideo && menuPosition.top > 0 && createPortal(
                  <div
                    data-download-menu
                    onMouseEnter={() => {
                      if (closeMenuTimeoutRef.current) {
                        clearTimeout(closeMenuTimeoutRef.current);
                        closeMenuTimeoutRef.current = null;
                      }
                      setShowDownloadMenu(true);
                      setIsMenuHovered(true);
                    }}
                    onMouseLeave={() => {
                      setIsMenuHovered(false);
                      if (closeMenuTimeoutRef.current) clearTimeout(closeMenuTimeoutRef.current);
                      closeMenuTimeoutRef.current = setTimeout(() => {
                        if (!isMenuHovered) setShowDownloadMenu(false);
                      }, 120);
                    }}
                    style={{
                      position: 'fixed',
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`,
                      background: 'rgba(10, 9, 8, 0.35)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(236, 227, 214, 0.15)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      minWidth: '140px',
                      zIndex: 10000,
                      pointerEvents: 'auto',
                    }}
                  >
                    {/* Download as Image */}
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowDownloadMenu(false);
                        // Handle action on mousedown since click may not fire if menu unmounts
                        handleExportPNG();
                      }}
                      onClick={(e) => {
                        // Prevent default click behavior (already handled on mousedown)
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px 12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(236, 227, 214, 0.7)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        textAlign: 'left',
                        transition: 'background 150ms ease, color 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 227, 214, 0.08)';
                        e.currentTarget.style.color = '#CAA554';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'rgba(236, 227, 214, 0.7)';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Download Image</span>
                    </button>
                    
                    {/* Download as Video */}
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowDownloadMenu(false);
                        // Handle action on mousedown since click may not fire if menu unmounts
                        handleExportVideo();
                      }}
                      onClick={(e) => {
                        // Prevent default click behavior (already handled on mousedown)
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px 12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(236, 227, 214, 0.7)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        textAlign: 'left',
                        borderTop: '1px solid rgba(236, 227, 214, 0.08)',
                        transition: 'background 150ms ease, color 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 227, 214, 0.08)';
                        e.currentTarget.style.color = '#CAA554';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'rgba(236, 227, 214, 0.7)';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <span>Download Video</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                title="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'rgba(236, 227, 214, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Left Column - glassmorphism with minimal background */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          position: 'relative',
          zIndex: 10,
          background: 'rgba(5, 4, 3, 0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(236, 227, 214, 0.08)',
        }}>
          <Readout label="Phase State" value={`TEMP: ${tempValue}`} valueColor="#CAA554">
            <PhaseCanvas value={getManifestationCoords.geometry} />
          </Readout>
          <Readout label="Superposition">
            <SuperpositionCanvas value={getManifestationCoords.alterity} />
          </Readout>
          <Readout label="Hallucination Index" value={`HIGH [${hallucinationScore}/5]`} valueColor="#C17F59">
            <HallucinationCanvas value={getManifestationCoords.dynamics} />
          </Readout>
        </div>

        {/* Center - transparent to show background media */}
        <div style={{ background: 'transparent', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {/* Only show particle canvas if no media */}
          {!mediaUrl && <CenterFieldCanvas />}

          {/* No image placeholder */}
          {!mediaUrl && (
            <div style={{ position: 'relative', zIndex: 10, fontSize: '12px', color: 'rgba(236, 227, 214, 0.3)', fontFamily: 'var(--font-mono)' }}>
              [NO IMAGE]
            </div>
          )}

          {/* Upload section - hidden in view mode, will show in edit mode future */}
          {/* TODO: Add isEditing prop to control visibility */}

          {/* Coordinates display - centered above visual */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'rgba(236, 227, 214, 0.4)',
            letterSpacing: '0.08em',
          }}>
            <span style={{ color: '#CAA554' }}>X:</span>
            <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{getManifestationCoords.geometry.toFixed(3)}</span>
            <span style={{ color: '#ECE3D6', marginLeft: '4px' }}>Y:</span>
            <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{getManifestationCoords.alterity.toFixed(3)}</span>
            <span style={{ color: '#5B8A7A', marginLeft: '4px' }}>Z:</span>
            <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{getManifestationCoords.dynamics.toFixed(3)}</span>
          </div>
        </div>

        {/* Right Column - glassmorphism with minimal background */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          position: 'relative',
          zIndex: 10,
          background: 'rgba(5, 4, 3, 0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(236, 227, 214, 0.08)',
        }}>
          <Readout label="Latent Position" value={`X:${getManifestationCoords.geometry.toFixed(3)} Y:${getManifestationCoords.alterity.toFixed(3)}`} valueSize="8px" value2={`Z:${getManifestationCoords.dynamics.toFixed(3)}`}>
            <CoordsCanvas value={getManifestationCoords} />
          </Readout>
          <Readout label="Manifold Curvature" value={displayDenizen.threatLevel === 'Volatile' || displayDenizen.threatLevel === 'Existential' ? 'SEVERE' : 'NOMINAL'} valueColor={displayDenizen.threatLevel === 'Volatile' || displayDenizen.threatLevel === 'Existential' ? '#C17F59' : '#5B8A7A'}>
            <ManifoldCanvas value={getManifestationCoords.alterity} />
          </Readout>
          <Readout label="Embedding Signature">
            <SpectralCanvas value={getManifestationCoords.dynamics} />
          </Readout>
        </div>

        {/* Footer - glassmorphism */}
        <div
          style={{
            gridColumn: '1 / -1',
            position: 'relative',
            zIndex: 10,
            background: 'rgba(10, 9, 8, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(236, 227, 214, 0.12)',
            padding: '12px 28px',
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Entity Class as large title */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: '#CAA554', letterSpacing: '0.1em', lineHeight: 1, textTransform: 'uppercase' }}>
              {(displayDenizen.entityClass || displayDenizen.name).toUpperCase()}
            </div>
            <div style={{ marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ color: 'rgba(236, 227, 214, 0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                TYPE <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{displayDenizen.type.toUpperCase()}</span>
              </div>
              <div style={{ color: 'rgba(236, 227, 214, 0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                THREAT <span style={{ color: displayDenizen.threatLevel === 'Volatile' || displayDenizen.threatLevel === 'Existential' ? '#C17F59' : 'rgba(236, 227, 214, 0.5)' }}>{displayDenizen.threatLevel.toUpperCase()}</span>
              </div>
              </div>
            </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            borderLeft: '1px solid rgba(236, 227, 214, 0.08)', 
            paddingLeft: '24px',
            paddingTop: '4px',
            paddingBottom: '4px',
          }}>
            <div 
              style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: '12px', 
                color: 'rgba(236, 227, 214, 0.5)', 
                lineHeight: 1.6,
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {displayDenizen.description}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   READOUT PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function Readout({ label, value, value2, valueColor = '#CAA554', valueSize = '10px', children }: {
  label: string;
  value?: string;
  value2?: string;
  valueColor?: string;
  valueSize?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(5, 4, 3, 0.03)',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      borderBottom: '1px solid rgba(236, 227, 214, 0.06)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(236, 227, 214, 0.4)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: 'rgba(202, 165, 84, 0.5)' }}>▸</span>
        {label}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {children}
      </div>
      {value && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: valueSize, color: valueColor, marginTop: '8px', textAlign: 'center', letterSpacing: '0.05em' }}>
          {value}
        </div>
      )}
      {value2 && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: valueSize, color: valueColor, marginTop: '2px', textAlign: 'center', letterSpacing: '0.05em' }}>
          {value2}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CANVAS HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: typeof GOLD, alpha: number, size = GRID) {
  const px = Math.floor(x / size) * size;
  const py = Math.floor(y / size) * size;
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  ctx.fillRect(px, py, size - 1, size - 1);
}

function drawParticleLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: typeof GOLD, alpha: number, density = 0.3) {
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const steps = Math.max(1, Math.floor(dist * density));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    drawPixel(ctx, x, y, color, alpha * (0.5 + Math.random() * 0.5));
  }
}

function drawParticleCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: typeof GOLD, alpha: number, density = 0.15) {
  const circumference = 2 * Math.PI * radius;
  const particles = Math.max(8, Math.floor(circumference * density));
  for (let i = 0; i < particles; i++) {
    const angle = (i / particles) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    drawPixel(ctx, x, y, color, alpha * (0.6 + Math.random() * 0.4));
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PHASE STATE — Particle Lissajous
   ═══════════════════════════════════════════════════════════════════════════ */

function PhaseCanvas({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ time: 0, particles: [] as { t: number; life: number; decay: number }[] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    if (state.particles.length === 0) {
      for (let i = 0; i < 50; i++) {
        state.particles.push({ t: Math.random() * Math.PI * 8, life: Math.random(), decay: 0.0005 + Math.random() * 0.001 });
      }
    }

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(5, 4, 3, 0.05)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const temp = (value + 1) / 2;
      const freqRatio = 1 + temp * 2.5;

      drawParticleLine(ctx, cx, 0, cx, height, GOLD, 0.08, 0.15);
      drawParticleLine(ctx, 0, cy, width, cy, GOLD, 0.08, 0.15);

      state.particles.forEach(p => {
        const noise = temp * Math.sin(p.t * 8 + state.time) * 0.08;
        const x = cx + Math.sin(p.t + state.time) * (width * 0.38) * (1 + noise);
        const y = cy + Math.sin(p.t * freqRatio + state.time * 0.7) * (height * 0.38) * (1 + noise);
        drawPixel(ctx, x, y, GOLD, p.life * 0.45);
        p.t += 0.015;
        p.life -= p.decay;
        if (p.life <= 0) {
          p.life = 1;
          p.t = state.time * 1.5 + Math.random() * 0.5;
        }
      });

      const headX = cx + Math.sin(state.time) * (width * 0.38);
      const headY = cy + Math.sin(state.time * freqRatio) * (height * 0.38);
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 5;
        drawPixel(ctx, headX + Math.cos(angle) * dist, headY + Math.sin(angle) * dist, GOLD, 0.2 + Math.random() * 0.15);
      }
      drawPixel(ctx, headX, headY, GOLD, 0.8, 4);

      state.time += 0.004;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUPERPOSITION — Particle Waveforms
   ═══════════════════════════════════════════════════════════════════════════ */

function SuperpositionCanvas({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  const waves = [
    { weight: 0.34, freq: 1.0, color: DYNAMICS },
    { weight: 0.28, freq: 1.5, color: GOLD },
    { weight: 0.22, freq: 2.2, color: VOLATILE },
    { weight: 0.16, freq: 3.0, color: DAWN }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(5, 4, 3, 0.1)';
      ctx.fillRect(0, 0, width, height);

      waves.forEach((wave, i) => {
        const baseY = height * (0.18 + i * 0.22);
        for (let x = 0; x < width; x += 4) {
          const t = (x / width) * Math.PI * 4 + timeRef.current;
          const amp = height * 0.08 * wave.weight * 2;
          const y = baseY + Math.sin(t * wave.freq) * amp;
          const flicker = 0.5 + Math.sin(t * 2 + timeRef.current) * 0.15;
          drawPixel(ctx, x, y, wave.color, flicker);
        }
      });

      const combinedY = height * 0.88;
      for (let x = 0; x < width; x += 3) {
        const t = (x / width) * Math.PI * 4 + timeRef.current;
        let sum = 0;
        waves.forEach(w => { sum += Math.sin(t * w.freq) * w.weight; });
        const y = combinedY + sum * height * 0.06;
        drawPixel(ctx, x, y, GOLD, 0.7);
      }

      timeRef.current += 0.008;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HALLUCINATION — Particle Radar with Ghosts
   ═══════════════════════════════════════════════════════════════════════════ */

function HallucinationCanvas({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ time: 0, ghosts: [] as { angle: number; dist: number; drift: number; flicker: number }[] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    if (state.ghosts.length === 0) {
      for (let i = 0; i < 4; i++) {
        state.ghosts.push({ angle: Math.random() * Math.PI * 2, dist: 0.3 + Math.random() * 0.5, drift: 0.002 + Math.random() * 0.004, flicker: Math.random() * Math.PI * 2 });
      }
    }

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(5, 4, 3, 0.08)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.45;

      [0.33, 0.66, 1.0].forEach(r => {
        drawParticleCircle(ctx, cx, cy, maxR * r, GOLD, 0.2, 0.12);
      });

      const sweepAngle = state.time * 0.5;
      for (let i = 0; i < 20; i++) {
        const r = (i / 20) * maxR;
        const fade = 1 - (i / 20) * 0.5;
        const x = cx + Math.cos(sweepAngle) * r;
        const y = cy + Math.sin(sweepAngle) * r;
        drawPixel(ctx, x, y, GOLD, 0.6 * fade);
      }

      state.ghosts.forEach(ghost => {
        ghost.angle += ghost.drift;
        const flicker = 0.4 + Math.sin(state.time * 1.5 + ghost.flicker) * 0.2;
        const gx = cx + Math.cos(ghost.angle) * maxR * ghost.dist;
        const gy = cy + Math.sin(ghost.angle) * maxR * ghost.dist;
        for (let i = 0; i < 4; i++) {
          const ox = (Math.random() - 0.5) * 6;
          const oy = (Math.random() - 0.5) * 6;
          drawPixel(ctx, gx + ox, gy + oy, VOLATILE, flicker * 0.6);
        }
      });

      drawPixel(ctx, cx, cy, GOLD, 0.9, 4);

      state.time += 0.006;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LATENT COORDS — Particle Star Field
   ═══════════════════════════════════════════════════════════════════════════ */

function CoordsCanvas({ value }: { value: { geometry: number; alterity: number; dynamics: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ time: 0, stars: [] as { x: number; y: number; brightness: number; twinkle: number }[] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    if (state.stars.length === 0) {
      for (let i = 0; i < 40; i++) {
        state.stars.push({ x: Math.random(), y: Math.random(), brightness: 0.2 + Math.random() * 0.5, twinkle: Math.random() * Math.PI * 2 });
      }
    }

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(5, 4, 3, 0.1)';
      ctx.fillRect(0, 0, width, height);

      const gridSize = 15;
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          if (Math.random() > 0.7) {
            drawPixel(ctx, x, y, GOLD, 0.08);
          }
        }
      }

      state.stars.forEach(star => {
        const twinkle = star.brightness * (0.7 + Math.sin(state.time * 0.8 + star.twinkle) * 0.3);
        drawPixel(ctx, star.x * width, star.y * height, DAWN, twinkle);
      });

      const entityX = width * ((value.geometry + 1) / 2 * 0.6 + 0.2);
      const entityY = height * ((value.alterity + 1) / 2 * 0.6 + 0.2);
      const pulse = 0.8 + Math.sin(state.time * 0.8) * 0.2;

      drawParticleLine(ctx, entityX, 0, entityX, height, GOLD, 0.15, 0.15);
      drawParticleLine(ctx, 0, entityY, width, entityY, GOLD, 0.15, 0.15);

      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 10;
        drawPixel(ctx, entityX + Math.cos(angle) * dist, entityY + Math.sin(angle) * dist, GOLD, 0.15 * pulse);
      }
      drawPixel(ctx, entityX, entityY, GOLD, 0.85 * pulse, 4);

      state.time += 0.006;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MANIFOLD — Particle Gravity Well
   ═══════════════════════════════════════════════════════════════════════════ */

function ManifoldCanvas({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ time: 0, particles: [] as { baseX: number; baseY: number; phase: number }[] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    if (state.particles.length === 0) {
      for (let x = 0; x < 12; x++) {
        for (let y = 0; y < 12; y++) {
          state.particles.push({ baseX: x / 11, baseY: y / 11, phase: Math.random() * Math.PI * 2 });
        }
      }
    }

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(5, 4, 3, 0.12)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const strength = 30 + Math.sin(state.time * 0.5) * 5;

      state.particles.forEach(p => {
        const x = p.baseX * width;
        const y = p.baseY * height;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.max(0, 1 - dist / 70) * strength;
        const warpedX = x + (dx / (dist || 1)) * pull;
        const warpedY = y + (dy / (dist || 1)) * pull;
        const alpha = 0.3 + (dist / 100) * 0.4;
        drawPixel(ctx, warpedX, warpedY, GOLD, alpha);
      });

      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 20;
        const alpha = 0.3 * (1 - dist / 20);
        drawPixel(ctx, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, VOLATILE, alpha);
      }

      drawPixel(ctx, cx, cy, VOLATILE, 0.9, 4);

      state.time += 0.008;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPECTRAL — Particle Spectrogram
   ═══════════════════════════════════════════════════════════════════════════ */

function SpectralCanvas({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ time: 0, signature: [] as { base: number; variance: number }[] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    if (state.signature.length === 0) {
      for (let i = 0; i < 32; i++) {
        state.signature.push({
          base: Math.sin(i * 0.3) * 0.3 + Math.sin(i * 0.7) * 0.2 + Math.sin(i * 1.3) * 0.15 + 0.5,
          variance: Math.random() * 0.1
        });
      }
    }

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(5, 4, 3, 0.08)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = width / state.signature.length;

      [0.25, 0.5, 0.75].forEach(yRatio => {
        for (let x = 0; x < width; x += 8) {
          drawPixel(ctx, x, height * yRatio, DAWN, 0.08);
        }
      });

      state.signature.forEach((band, i) => {
        const animate = Math.sin(state.time + i * 0.2) * band.variance;
        const h = (band.base + animate) * height * 0.85;
        const color = i / state.signature.length < 0.5 ? DYNAMICS : GOLD;

        for (let y = height; y > height - h; y -= GRID) {
          const alpha = 0.3 + (1 - (y / height)) * 0.4;
          drawPixel(ctx, i * barWidth + barWidth / 2, y, color, alpha);
        }
      });

      const scanX = (state.time * 8) % width;
      for (let y = 0; y < height; y += GRID * 2) {
        drawPixel(ctx, scanX, y, DAWN, 0.4);
      }

      state.time += 0.006;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CENTER FIELD — Particle Environment
   ═══════════════════════════════════════════════════════════════════════════ */

function CenterFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ time: 0, particles: [] as { x: number; y: number; vx: number; vy: number; alpha: number }[] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId: number;

    function draw() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      const state = stateRef.current;
      if (state.particles.length === 0) {
        for (let i = 0; i < 60; i++) {
          state.particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1,
            alpha: 0.1 + Math.random() * 0.15
          });
        }
      }

      ctx.fillStyle = 'rgba(5, 4, 3, 0.05)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      [0.4, 0.6, 0.8].forEach(r => {
        const radius = Math.min(width, height) * r * 0.5;
        drawParticleCircle(ctx, cx, cy, radius, GOLD, 0.12, 0.08);
      });

      drawParticleLine(ctx, cx, height * 0.1, cx, height * 0.9, GOLD, 0.1, 0.08);
      drawParticleLine(ctx, width * 0.1, cy, width * 0.9, cy, GOLD, 0.1, 0.08);

      state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        drawPixel(ctx, p.x, p.y, GOLD, p.alpha);
      });

      const bracketInset = 0.25;
      const bracketSize = 20;
      const corners = [
        { x: width * bracketInset, y: height * bracketInset },
        { x: width * (1 - bracketInset), y: height * bracketInset },
        { x: width * bracketInset, y: height * (1 - bracketInset) },
        { x: width * (1 - bracketInset), y: height * (1 - bracketInset) }
      ];

      corners.forEach((c, i) => {
        const hDir = (i % 2 === 0) ? 1 : -1;
        const vDir = (i < 2) ? 1 : -1;
        drawParticleLine(ctx, c.x, c.y, c.x + bracketSize * hDir, c.y, GOLD, 0.5, 0.4);
        drawParticleLine(ctx, c.x, c.y, c.x, c.y + bracketSize * vDir, GOLD, 0.5, 0.4);
      });

      state.time += 0.005;
      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}


