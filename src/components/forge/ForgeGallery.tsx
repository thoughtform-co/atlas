'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Fetch generations
  const fetchGenerations = useCallback(async () => {
    try {
      let url: string;
      
      if (sessionId) {
        // Fetch specific session
        url = `/api/forge/sessions/${sessionId}`;
      } else {
        // This would need a separate endpoint for all approved videos
        // For now, we'll handle this in the home page differently
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
        setGenerations(gens);
      } else {
        // Aggregate all generations from all sessions
        const allGenerations: ForgeGeneration[] = [];
        for (const session of data.sessions || []) {
          // Would need to fetch each session's generations
          // This is a limitation - better to have a dedicated endpoint
        }
        setGenerations(allGenerations);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, approvedOnly]);

  useEffect(() => {
    fetchGenerations();
    
    // Poll for updates every 5 seconds (for pending generations)
    const interval = setInterval(() => {
      const hasPending = generations.some(g => 
        g.status === 'pending' || g.status === 'processing'
      );
      if (hasPending) {
        fetchGenerations();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGenerations, generations]);

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
