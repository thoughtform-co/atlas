'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './forge.module.css';
import { ForgeVideoCard, type ForgeGeneration } from '@/components/forge';

export default function ForgePage() {
  const router = useRouter();
  const [generations, setGenerations] = useState<ForgeGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved'>('all');

  // Fetch all generations from all sessions
  const fetchGenerations = useCallback(async () => {
    try {
      // First get all sessions
      const sessionsRes = await fetch('/api/forge/sessions');
      if (!sessionsRes.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const sessionsData = await sessionsRes.json();
      const sessions = sessionsData.sessions || [];

      // Fetch generations from each session
      const allGenerations: ForgeGeneration[] = [];
      for (const session of sessions) {
        const sessionRes = await fetch(`/api/forge/sessions/${session.id}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const gens = sessionData.session?.forge_generations || [];
          allGenerations.push(...gens);
        }
      }

      // Sort by created_at descending
      allGenerations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setGenerations(allGenerations);
    } catch (error) {
      console.error('Failed to fetch generations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  // Handle approval toggle
  const handleApprove = useCallback(async (generationId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/forge/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generation_id: generationId, approved }),
      });

      if (response.ok) {
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

  // Handle reuse - navigate to session with params
  const handleReuse = useCallback((generation: ForgeGeneration) => {
    // Could implement a global state or query params for reuse
    // For now, just navigate to the session
    router.push(`/forge/${generation.id}`);
  }, [router]);

  // Filter generations
  const filteredGenerations = filter === 'approved' 
    ? generations.filter(g => g.approved) 
    : generations;

  // Only show completed generations
  const completedGenerations = filteredGenerations.filter(g => g.status === 'completed');

  return (
    <div className={styles.homePage}>
      {/* Filter Toggle */}
      <div className={styles.filterBar}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.filterActive : ''}`}
          onClick={() => setFilter('all')}
        >
          ALL
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'approved' ? styles.filterActive : ''}`}
          onClick={() => setFilter('approved')}
        >
          APPROVED
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading generations...</span>
        </div>
      ) : completedGenerations.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◇</div>
          <span className={styles.emptyTitle}>
            {filter === 'approved' ? 'No approved videos' : 'No videos yet'}
          </span>
          <span className={styles.emptyText}>
            {filter === 'approved' 
              ? 'Approve videos in your sessions to see them here'
              : 'Create a new session and generate your first video'}
          </span>
          {filter === 'all' && (
            <button 
              className={styles.createButton}
              onClick={() => {
                // Create a new session and navigate to it
                fetch('/api/forge/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: `Session ${new Date().toLocaleDateString()}` }),
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.session) {
                      router.push(`/forge/${data.session.id}`);
                    }
                  })
                  .catch(console.error);
              }}
            >
              CREATE SESSION
            </button>
          )}
        </div>
      ) : (
        <div className={styles.gallery}>
          {completedGenerations.map(generation => (
            <ForgeVideoCard
              key={generation.id}
              generation={generation}
              onApprove={handleApprove}
              onReuse={handleReuse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
