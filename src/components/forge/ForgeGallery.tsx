'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ForgeGallery.module.css';
import { ForgeVideoCard, type ForgeGeneration } from './ForgeVideoCard';

interface ForgeGalleryProps {
  sessionId?: string;
  approvedOnly?: boolean;
  onReuseParams?: (generation: ForgeGeneration) => void;
}

export function ForgeGallery({ sessionId, approvedOnly = false, onReuseParams }: ForgeGalleryProps) {
  const [generations, setGenerations] = useState<ForgeGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch generations
  const fetchGenerations = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      let url: string;
      
      if (sessionId) {
        // Fetch specific session
        url = `/api/forge/sessions/${sessionId}`;
      } else {
        url = `/api/forge/sessions`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch generations');
      }

      const data = await response.json();
      
      if (sessionId) {
        let gens = data.session?.forge_generations || [];
        if (approvedOnly) {
          gens = gens.filter((g: ForgeGeneration) => g.approved);
        }
        // Sort by created_at descending (newest first)
        gens.sort((a: ForgeGeneration, b: ForgeGeneration) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setGenerations(gens);
      } else {
        // Aggregate all generations from all sessions
        const allGenerations: ForgeGeneration[] = [];
        for (const session of data.sessions || []) {
          // Would need to fetch each session's generations
        }
        setGenerations(allGenerations);
      }

      setError(null);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId, approvedOnly]);

  // Initial fetch
  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  // Polling for in-progress generations (separate effect to avoid dependency issues)
  useEffect(() => {
    const hasPending = generations.some(g => 
      g.status === 'pending' || g.status === 'processing'
    );

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Set up polling if there are pending generations
    if (hasPending) {
      pollIntervalRef.current = setInterval(() => {
        fetchGenerations(true); // Silent fetch
      }, 3000); // Poll every 3 seconds for better UX
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [generations, fetchGenerations]);

  // Handle approval toggle
  const handleApprove = useCallback(async (generationId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/forge/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: generationId, approved }),
      });

      if (response.ok) {
        // Update local state
        setGenerations(prev => 
          prev.map(g => 
            g.id === generationId ? { ...g, approved } : g
          )
        );
      }
    } catch (error) {
      console.error('Failed to update approval:', error);
    }
  }, []);

  // Handle reuse params
  const handleReuse = useCallback((generation: ForgeGeneration) => {
    onReuseParams?.(generation);
  }, [onReuseParams]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading generations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span>{error}</span>
        <button onClick={fetchGenerations}>Retry</button>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>◇</div>
        <span className={styles.emptyTitle}>No generations yet</span>
        <span className={styles.emptyText}>
          Upload an image and describe the motion to create your first video
        </span>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      {generations.map(generation => (
        <ForgeVideoCard
          key={generation.id}
          generation={generation}
          onApprove={handleApprove}
          onReuse={handleReuse}
        />
      ))}
    </div>
  );
}
