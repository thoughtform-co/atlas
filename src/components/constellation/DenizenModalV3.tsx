'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const closeMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update currentDenizen when denizen prop changes
  useEffect(() => {
    setCurrentDenizen(denizen);
  }, [denizen]);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !denizen || !e.target.files?.length) return;
    setIsUploading(true);
    setUploadError(null);

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${denizen.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('denizen-media')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('denizen-media')
        .getPublicUrl(fileName);

      const mediaInsert: DenizenMediaInsert = {
        denizen_id: denizen.id,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        storage_path: fileName,  // Store relative path, not full URL
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: 0,
        is_primary: !denizen.media?.length,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any).from('denizen_media').insert(mediaInsert);
      if (dbError) throw dbError;

      // Refetch the denizen with updated media from database
      if (denizen) {
        const updatedDenizen = await fetchDenizenById(denizen.id);
        if (updatedDenizen) {
          setCurrentDenizen(updatedDenizen);
          // Notify parent component of the update
          onDenizenUpdate?.(updatedDenizen);
        }
      }

      // Update local state to show the uploaded media immediately
      setUploadedMedia({
        url: publicUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image'
      });
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Use currentDenizen (which may be updated after upload) or fallback to denizen prop
  const displayDenizen = currentDenizen || denizen;
  if (!displayDenizen) return null;

  // Handle edit navigation
  const handleEdit = () => {
    router.push(`/admin/edit/${displayDenizen.id}`);
  };

  const signalStrength = ((displayDenizen.coordinates.geometry + 1) / 2).toFixed(3);
  const epoch = displayDenizen.firstObserved || '4.2847';
  const tempValue = ((displayDenizen.coordinates.dynamics + 1) / 2).toFixed(2);
  const hallucinationScore = Math.round((displayDenizen.coordinates.dynamics + 1) * 2.5);

  // Helper to convert storage path to public URL
  const resolveMediaUrl = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    // If it's already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Otherwise convert from storage path
    return getMediaPublicUrl(path) || undefined;
  };

  // Use uploaded media if available, otherwise use denizen's existing media
  const primaryMedia = displayDenizen.media?.find(m => m.isPrimary) || displayDenizen.media?.[0];
  const mediaUrl = uploadedMedia?.url || resolveMediaUrl(primaryMedia?.storagePath) || displayDenizen.image;
  
  // Get thumbnail URL (for video entities)
  const thumbnailUrl = displayDenizen.thumbnail ? resolveMediaUrl(displayDenizen.thumbnail) : undefined;
  
  // Check if media is video based on multiple sources
  const isVideoFromMedia = uploadedMedia?.type === 'video' || primaryMedia?.mediaType === 'video';
  const isVideoFromUrl = displayDenizen.videoUrl != null;
  // Also check file extension of image field (for entities created before denizen_media table)
  const isVideoFromExtension = mediaUrl?.match(/\.(mp4|webm|mov|avi|mkv)$/i) != null;
  const isVideo = isVideoFromMedia || isVideoFromUrl || isVideoFromExtension;

  // Export card as PNG
  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    
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
        video.pause();
        videoElement = video;
        originalVideoDisplay = video.style.display;
        
        try {
          let imageSrc: string | null = null;
          
          // Prefer thumbnail URL if available
          if (thumbnailUrl) {
            imageSrc = thumbnailUrl;
          } else {
            // Fallback: capture current video frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = video.videoWidth || 1280;
            frameCanvas.height = video.videoHeight || 720;
            const ctx = frameCanvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
              imageSrc = frameCanvas.toDataURL('image/jpeg', 0.95);
            }
          }
          
          if (imageSrc) {
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
                frameImg.onload = () => resolve();
                frameImg.onerror = () => resolve(); // Resolve even on error to not block
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
      
      // Use html2canvas with exact dimensions
      const canvas = await html2canvas(card, {
        backgroundColor: '#050403',
        scale: 2,
        logging: false,
        useCORS: true,
        width: cardRect.width,
        height: cardRect.height,
        windowWidth: cardRect.width,
        windowHeight: cardRect.height,
      });
      
      // Download
      const link = document.createElement('a');
      link.download = `${displayDenizen.name.toLowerCase().replace(/\s+/g, '-')}-atlas-card.png`;
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
    if (isVideo && video) {
      video.play().catch((e) => {
        console.warn('Could not play video for recording:', e);
      });
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
      
      // Setup MediaRecorder - try MP4 first, fallback to WebM
      const stream = recordCanvas.captureStream(fps);
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder not supported in this browser');
      }
      
      // Try MP4 (H.264), fallback to WebM
      let mimeType = 'video/mp4';
      let fileExtension = 'mp4';
      if (!MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/webm;codecs=vp9';
        fileExtension = 'webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps for good quality
      });
      
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
        link.download = `${displayDenizen.name.toLowerCase().replace(/\s+/g, '-')}-atlas-card.${fileExtension}`;
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
          // Clear canvas
          recordCtx.fillStyle = '#050403';
          recordCtx.fillRect(0, 0, recordCanvas.width, recordCanvas.height);
          
          // If video exists, draw it as background first
          if (isVideo && video && video.readyState >= 2) {
            try {
              // Draw video frame scaled to canvas
              recordCtx.drawImage(
                video,
                0, 0, video.videoWidth, video.videoHeight,
                0, 0, recordCanvas.width, recordCanvas.height
              );
            } catch (e) {
              console.warn('Could not draw video frame:', e);
            }
          }
          
          // Capture UI elements with html2canvas (this will include everything except video)
          const frameCanvas = await html2canvas(card, {
            backgroundColor: 'transparent',
            scale: 2,
            logging: false,
            useCORS: true,
            width: cardRect.width,
            height: cardRect.height,
            ignoreElements: (element) => {
              // Ignore the video element since we're drawing it separately
              return element.tagName === 'VIDEO';
            },
          });
          
          // Composite UI on top of video background
          recordCtx.drawImage(frameCanvas, 0, 0, recordCanvas.width, recordCanvas.height);
          
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ padding: '16px', background: 'rgba(5, 4, 3, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Card — 4:5 Aspect */}
      <div
        ref={cardRef}
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: '720px',
          aspectRatio: '4/5',
          background: '#050403',
          display: 'grid',
          gridTemplateColumns: '150px 1fr 150px',
          gridTemplateRows: '32px 1fr 110px',
          gap: '1px',
          border: '1px solid rgba(236, 227, 214, 0.08)',
        }}
      >
        {/* Full-bleed Media Background */}
        {mediaUrl && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {isVideo ? (
              <video
                ref={videoRef}
                src={displayDenizen.videoUrl || mediaUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <Image
                src={mediaUrl}
                alt={displayDenizen.name}
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
            
            {/* Action buttons - consistent sizing, tighter spacing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
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
            <PhaseCanvas value={displayDenizen.coordinates.geometry} />
          </Readout>
          <Readout label="Superposition">
            <SuperpositionCanvas value={displayDenizen.coordinates.alterity} />
          </Readout>
          <Readout label="Hallucination Index" value={`HIGH [${hallucinationScore}/5]`} valueColor="#C17F59">
            <HallucinationCanvas value={displayDenizen.coordinates.dynamics} />
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
          <Readout label="Latent Position" value={`X:${displayDenizen.coordinates.geometry.toFixed(3)} Y:${displayDenizen.coordinates.alterity.toFixed(3)}`} valueSize="8px" value2={`Z:${displayDenizen.coordinates.dynamics.toFixed(3)}`}>
            <CoordsCanvas value={displayDenizen.coordinates} />
          </Readout>
          <Readout label="Manifold Curvature" value={displayDenizen.threatLevel === 'Volatile' || displayDenizen.threatLevel === 'Existential' ? 'SEVERE' : 'NOMINAL'} valueColor={displayDenizen.threatLevel === 'Volatile' || displayDenizen.threatLevel === 'Existential' ? '#C17F59' : '#5B8A7A'}>
            <ManifoldCanvas value={displayDenizen.coordinates.alterity} />
          </Readout>
          <Readout label="Embedding Signature">
            <SpectralCanvas value={displayDenizen.coordinates.dynamics} />
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
            padding: '16px 28px',
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: '#CAA554', letterSpacing: '0.1em', lineHeight: 1, textTransform: 'uppercase' }}>
              {displayDenizen.name.toUpperCase()}
            </div>
            <div style={{ marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'rgba(236, 227, 214, 0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                CLASS <span style={{ color: 'rgba(236, 227, 214, 0.5)' }}>{displayDenizen.type.toUpperCase()}</span>
              </div>
              <div style={{ color: 'rgba(236, 227, 214, 0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                THREAT <span style={{ color: displayDenizen.threatLevel === 'Volatile' || displayDenizen.threatLevel === 'Existential' ? '#C17F59' : 'rgba(236, 227, 214, 0.5)' }}>{displayDenizen.threatLevel.toUpperCase()}</span>
              </div>
              <div style={{ marginTop: '4px', color: 'rgba(236, 227, 214, 0.3)' }}>
                <span style={{ color: '#CAA554' }}>◆</span> {displayDenizen.coordinates.geometry.toFixed(3)}
                <span style={{ color: '#ECE3D6', marginLeft: '8px' }}>○</span> {displayDenizen.coordinates.alterity.toFixed(3)}
                <span style={{ color: '#5B8A7A', marginLeft: '8px' }}>◇</span> {displayDenizen.coordinates.dynamics.toFixed(3)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(236, 227, 214, 0.08)', paddingLeft: '24px' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'rgba(236, 227, 214, 0.5)', lineHeight: 1.7 }}>
              {displayDenizen.description}
            </div>
          </div>
        </div>
      </div>
    </div>
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

