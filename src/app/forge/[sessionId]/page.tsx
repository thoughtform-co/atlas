'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../forge.module.css';
import { ForgePromptBar, ForgeGallery, ForgeLoadingOverlay, type ForgeGeneration } from '@/components/forge';

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

// Estimated generation times by duration (in seconds)
const ESTIMATED_TIMES = {
  5: 45,   // 5s video ~ 45s generation
  10: 90,  // 10s video ~ 90s generation
};

interface ActiveGeneration {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration: number;
  startTime: number;
  errorMessage?: string;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/forge/sessions/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Session not found');
          return;
        }
        throw new Error('Failed to fetch session');
      }
      const data = await response.json();
      setSession(data.session);
      
      // Check for any processing generations
      const generations = data.session?.forge_generations || [];
      const processing = generations.find(
        (g: ForgeGeneration) => g.status === 'pending' || g.status === 'processing'
      );
      
      if (processing) {
        setActiveGeneration({
          id: processing.id,
          status: processing.status,
          duration: processing.duration || 5,
          startTime: new Date(processing.created_at).getTime(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Poll for generation status when there's an active generation
  useEffect(() => {
    if (!activeGeneration) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/forge/generate?id=${activeGeneration.id}`);
        if (response.ok) {
          const data = await response.json();
          const generation = data.generation;
          const status = generation?.status;
          
          if (status === 'completed') {
            setActiveGeneration(null);
            setRefreshKey(prev => prev + 1);
          } else if (status === 'failed') {
            // Keep overlay visible to show error state
            setActiveGeneration(prev => prev ? { 
              ...prev, 
              status: 'failed',
              errorMessage: generation?.error || 'Generation failed'
            } : null);
          } else {
            setActiveGeneration(prev => prev ? { ...prev, status } : null);
          }
        }
      } catch (err) {
        console.error('Failed to poll generation status:', err);
      }
    };

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(pollStatus, 3000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [activeGeneration?.id]);

  // Handle generation start - set active generation
  const handleGenerate = useCallback((generationId?: string, duration?: number) => {
    if (generationId) {
      setActiveGeneration({
        id: generationId,
        status: 'processing',
        duration: duration || 5,
        startTime: Date.now(),
      });
    }
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle cancel generation
  const handleCancelGeneration = useCallback(async () => {
    if (!activeGeneration) return;
    // For now, just hide the overlay - could add actual cancel API
    setActiveGeneration(null);
  }, [activeGeneration]);

  // Handle dismiss error overlay
  const handleDismissError = useCallback(() => {
    setActiveGeneration(null);
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle retry (dismiss and let user try again)
  const handleRetry = useCallback(() => {
    setActiveGeneration(null);
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle reuse params (could populate prompt bar)
  const handleReuseParams = useCallback((generation: ForgeGeneration) => {
    console.log('Reuse params:', generation);
  }, []);

  if (loading) {
    return (
      <div className={styles.sessionPage}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className={styles.sessionPage}>
        <div className={styles.error}>
          <span>{error || 'Session not found'}</span>
          <button onClick={() => router.push('/forge')}>Back to Forge</button>
        </div>
      </div>
    );
  }

  // Calculate estimated time for loading overlay
  const estimatedDuration = activeGeneration 
    ? ESTIMATED_TIMES[activeGeneration.duration as 5 | 10] || 60 
    : 60;

  return (
    <div className={styles.sessionPage}>
      {/* Loading/Error Overlay */}
      <ForgeLoadingOverlay
        isVisible={!!activeGeneration}
        estimatedDuration={estimatedDuration}
        status={activeGeneration?.status}
        errorMessage={activeGeneration?.errorMessage}
        onCancel={activeGeneration?.status !== 'failed' ? handleCancelGeneration : undefined}
        onRetry={activeGeneration?.status === 'failed' ? handleRetry : undefined}
        onDismiss={activeGeneration?.status === 'failed' ? handleDismissError : undefined}
      />

      {/* Session Header */}
      <div className={styles.sessionHeader}>
        <h1 className={styles.sessionTitle}>{session.name}</h1>
      </div>

      {/* Gallery */}
      <ForgeGallery 
        key={refreshKey}
        sessionId={sessionId} 
        onReuseParams={handleReuseParams}
      />

      {/* Prompt Bar */}
      <ForgePromptBar 
        sessionId={sessionId}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
