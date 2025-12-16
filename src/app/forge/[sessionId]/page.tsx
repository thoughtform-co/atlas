'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../forge.module.css';
import { ForgePromptBar, ForgeGallery, type ForgeGeneration } from '@/components/forge';

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reuseData, setReuseData] = useState<{ prompt: string; image: string } | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Handle generation start - trigger gallery refresh
  const handleGenerate = useCallback(() => {
    // Increment key to force gallery refresh and show the new generation
    setRefreshKey(prev => prev + 1);
  }, []);

  // Handle reuse params - populate prompt bar with prompt and image
  const handleReuseParams = useCallback((generation: ForgeGeneration) => {
    setReuseData({
      prompt: generation.prompt,
      image: generation.source_image_url,
    });
  }, []);

  // Handle send to library (placeholder for now)
  const handleSendToLibrary = useCallback((generation: ForgeGeneration) => {
    console.log('Send to library:', generation);
    // TODO: Implement send to entities library
  }, []);

  // Clear reuse data after it's been consumed
  const handleReuseConsumed = useCallback(() => {
    setReuseData(null);
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

  return (
    <div className={styles.sessionPage}>
      {/* Gallery Feed - shows all generations with inline progress */}
      <ForgeGallery 
        key={refreshKey}
        sessionId={sessionId} 
        onReuseParams={handleReuseParams}
        onSendToLibrary={handleSendToLibrary}
      />

      {/* Prompt Bar */}
      <ForgePromptBar 
        sessionId={sessionId}
        onGenerate={handleGenerate}
        reuseData={reuseData}
        onReuseConsumed={handleReuseConsumed}
      />
    </div>
  );
}
