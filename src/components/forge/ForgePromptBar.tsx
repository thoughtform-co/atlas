'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './ForgePromptBar.module.css';
import { ForgeDenizenSelect } from './ForgeDenizenSelect';
import type { VideoResolution, VideoDuration } from '@/lib/replicate';

interface ForgePromptBarProps {
  sessionId: string;
  onGenerate?: () => void;
  disabled?: boolean;
}

export function ForgePromptBar({ sessionId, onGenerate, disabled }: ForgePromptBarProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [denizenId, setDenizenId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImage(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImage(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Clear image
  const clearImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Submit generation
  const handleGenerate = async () => {
    if (!image || !prompt.trim() || generating || disabled) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/forge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          denizen_id: denizenId,
          image,
          prompt: prompt.trim(),
          negative_prompt: negativePrompt.trim() || undefined,
          resolution,
          duration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start generation');
      }

      // Clear form on success
      setPrompt('');
      setNegativePrompt('');
      clearImage();
      onGenerate?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  const canGenerate = image && prompt.trim() && !generating && !disabled;

  return (
    <div className={styles.promptBar}>
      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.content}>
        {/* Image Upload Zone */}
        <div 
          className={styles.imageZone}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className={styles.fileInput}
          />
          
          {imagePreview ? (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Selected" />
              <button 
                className={styles.clearImage} 
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <span className={styles.uploadIcon}>+</span>
              <span className={styles.uploadText}>IMAGE</span>
            </div>
          )}
        </div>

        {/* Prompt Input Area */}
        <div className={styles.inputArea}>
          {/* Main Prompt */}
          <div className={styles.promptWrapper}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the motion and animation..."
              className={styles.promptInput}
              rows={2}
              disabled={generating || disabled}
            />
          </div>

          {/* Negative Prompt (collapsible) */}
          {showNegative && (
            <div className={styles.negativeWrapper}>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Negative prompt (what to avoid)..."
                className={styles.negativeInput}
                rows={1}
                disabled={generating || disabled}
              />
            </div>
          )}

          {/* Parameters Row */}
          <div className={styles.paramsRow}>
            {/* Negative Toggle */}
            <button
              className={`${styles.paramButton} ${showNegative ? styles.paramActive : ''}`}
              onClick={() => setShowNegative(!showNegative)}
              title="Negative prompt"
            >
              NEG
            </button>

            {/* Resolution */}
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as VideoResolution)}
              className={styles.paramSelect}
              disabled={generating || disabled}
            >
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>

            {/* Duration */}
            <div className={styles.durationToggle}>
              <button
                className={`${styles.durationBtn} ${duration === 5 ? styles.durationActive : ''}`}
                onClick={() => setDuration(5)}
                disabled={generating || disabled}
              >
                5s
              </button>
              <button
                className={`${styles.durationBtn} ${duration === 10 ? styles.durationActive : ''}`}
                onClick={() => setDuration(10)}
                disabled={generating || disabled}
              >
                10s
              </button>
            </div>

            {/* Denizen Link */}
            <ForgeDenizenSelect
              value={denizenId}
              onChange={setDenizenId}
              disabled={generating || disabled}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {generating ? (
            <span className={styles.generating}>
              <span className={styles.spinner} />
            </span>
          ) : (
            <span className={styles.generateIcon}>▶</span>
          )}
        </button>
      </div>
    </div>
  );
}
