'use client';

import { useState, useRef, useCallback } from 'react';
import { EntityFormData } from '@/app/admin/new-entity/page';
import styles from './MediaUploadZone.module.css';

interface MediaUploadZoneProps {
  onMediaAnalyzed: (data: Partial<EntityFormData> & { visualNotes?: string; thumbnailUrl?: string }) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  compact?: boolean;
  existingMediaUrl?: string;
  existingMimeType?: string;
  onClear?: () => void;
  skipAnalysis?: boolean; // If true, only upload media without analyzing/extracting fields
}

// Extract first frame from video as a thumbnail
const extractVideoThumbnail = (file: File): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      // Seek to first frame
      video.currentTime = 0;
    };
    
    video.onseeked = () => {
      // Create canvas and draw the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        // Clean up
        URL.revokeObjectURL(video.src);
        resolve(blob);
      }, 'image/jpeg', 0.9);
    };
    
    video.onerror = () => {
      console.error('Failed to load video for thumbnail extraction');
      resolve(null);
    };
    
    // Load the video file
    video.src = URL.createObjectURL(file);
  });
};

export function MediaUploadZone({
  onMediaAnalyzed,
  isAnalyzing,
  setIsAnalyzing,
  compact = false,
  existingMediaUrl,
  existingMimeType,
  onClear,
  skipAnalysis = false,
}: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Use: jpg, png, webp, gif, mp4, webm, or mov');
      return;
    }

    // Validate file size
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      setError(`File too large. Maximum: ${maxMB}MB`);
      return;
    }

    // Start upload
    setUploadProgress(10);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // For videos, extract thumbnail first
      let thumbnailUrl: string | undefined;
      if (isVideo) {
        setUploadProgress(15);
        const thumbnailBlob = await extractVideoThumbnail(file);
        
        if (thumbnailBlob) {
          // Upload thumbnail
          const thumbFormData = new FormData();
          const thumbFile = new File([thumbnailBlob], `thumb_${file.name.replace(/\.[^.]+$/, '.jpg')}`, { type: 'image/jpeg' });
          thumbFormData.append('file', thumbFile);
          
          const thumbResponse = await fetch('/api/admin/upload', {
            method: 'POST',
            body: thumbFormData,
          });
          
          if (thumbResponse.ok) {
            try {
              const thumbResult = await thumbResponse.json();
              thumbnailUrl = thumbResult.publicUrl;
              console.log('[MediaUpload] Thumbnail uploaded:', thumbnailUrl);
            } catch (err) {
              console.warn('[MediaUpload] Failed to parse thumbnail response:', err);
            }
          } else {
            console.warn('[MediaUpload] Thumbnail upload failed, continuing without thumbnail');
          }
        }
      }

      // Upload main file
      setUploadProgress(30);
      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        // Handle different error response types
        let errorMessage = 'Upload failed';
        const contentType = uploadResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await uploadResponse.json();
            errorMessage = error.error || 'Upload failed';
          } catch {
            errorMessage = `Upload failed with status ${uploadResponse.status}`;
          }
        } else {
          // Handle non-JSON responses (e.g., 413 HTML error pages)
          if (uploadResponse.status === 413) {
            errorMessage = 'File too large. Maximum size: 100MB for videos, 10MB for images';
          } else {
            errorMessage = `Upload failed with status ${uploadResponse.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(60);
      
      setUploadedFile({
        name: file.name,
        url: uploadResult.publicUrl,
        type: file.type,
      });

      // If skipAnalysis is true, only update media URL without field extraction
      // WHY: When editing existing entities, changing media should only update the media file,
      // not trigger field extraction that would overwrite existing entity data
      if (skipAnalysis) {
        setUploadProgress(100);
        setIsAnalyzing(false);
        console.log('[MediaUpload] Skipping analysis - only updating media URL');
        onMediaAnalyzed({
          mediaUrl: uploadResult.publicUrl,
          mediaMimeType: file.type,
          thumbnailUrl,
        });
        return;
      }

      // Start AI analysis
      setIsAnalyzing(true);
      setUploadProgress(70);

      // Convert to base64 for analysis
      const base64 = await fileToBase64(file);
      
      const analyzeResponse = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          mimeType: file.type,
        }),
      });

      setUploadProgress(90);

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        console.error('[MediaUpload] Analysis API failed:', analyzeResponse.status, error);
        // Don't throw - analysis is optional
        setIsAnalyzing(false);
        setUploadProgress(100);
        
        // Still update with the media URL and thumbnail
        onMediaAnalyzed({
          mediaUrl: uploadResult.publicUrl,
          mediaMimeType: file.type,
          thumbnailUrl,
        });
        return;
      }

      const analysisResult = await analyzeResponse.json();
      setUploadProgress(100);
      setIsAnalyzing(false);

      console.log('[MediaUpload] Analysis result:', analysisResult);

      // Apply analysis results
      if (analysisResult.success && analysisResult.formData) {
        console.log('[MediaUpload] Applying form data:', analysisResult.formData);
        onMediaAnalyzed({
          ...analysisResult.formData,
          mediaUrl: uploadResult.publicUrl,
          mediaMimeType: file.type,
          thumbnailUrl,
        });
      } else {
        console.warn('[MediaUpload] No form data in result, only setting media URL');
        onMediaAnalyzed({
          mediaUrl: uploadResult.publicUrl,
          mediaMimeType: file.type,
          thumbnailUrl,
        });
      }

    } catch (err) {
      console.error('Upload/analysis error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
      setIsAnalyzing(false);
    }
  }, [onMediaAnalyzed, setIsAnalyzing]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Click to upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Clear uploaded file
  const handleClear = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
    onClear?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine if we have media from either internal upload or existing props
  const activeMedia = uploadedFile || (existingMediaUrl && existingMimeType ? { url: existingMediaUrl, type: existingMimeType, name: '' } : null);

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={handleInputChange}
          className={styles.hiddenInput}
        />
        <div className={styles.compactActions}>
          <button className={styles.compactUpload} onClick={handleClick} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Upload Media'}
          </button>
          {activeMedia && (
            <button className={styles.compactRemove} onClick={handleClear}>
              Remove
            </button>
          )}
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className={styles.compactProgress}>
            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
            <span>{uploadProgress}%</span>
          </div>
        )}
        {error && <div className={styles.error}>⚠ {error}</div>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        onChange={handleInputChange}
        className={styles.hiddenInput}
      />

      {activeMedia ? (
        <div className={styles.preview}>
          {activeMedia.type.startsWith('video/') ? (
            <video
              src={activeMedia.url}
              className={styles.previewMedia}
              controls
              muted
            />
          ) : (
            <img
              src={activeMedia.url}
              alt="Uploaded media"
              className={styles.previewMedia}
            />
          )}
          <div className={styles.previewInfo}>
            <span className={styles.previewName}>{uploadedFile?.name || 'Uploaded media'}</span>
            <button className={styles.clearButton} onClick={handleClear}>
              ✕ Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${isAnalyzing ? styles.analyzing : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {isAnalyzing ? (
            <>
              <div className={styles.spinner} />
              <span className={styles.dropzoneText}>Analyzing with Gemini AI...</span>
            </>
          ) : uploadProgress > 0 && uploadProgress < 100 ? (
            <>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className={styles.dropzoneText}>Uploading... {uploadProgress}%</span>
            </>
          ) : (
            <>
              <span className={styles.dropzoneIcon}>↑</span>
              <span className={styles.dropzoneText}>
                Drop image or video, or click to upload
              </span>
              <span className={styles.dropzoneSubtext}>
                jpg, png, webp, gif, mp4, webm, mov
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

