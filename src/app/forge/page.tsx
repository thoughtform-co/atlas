'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './forge.module.css';

interface ForgeSession {
  id: string;
  name: string;
  created_at: string;
  generation_count: number;
  completed_count: number;
}

export default function ForgePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ForgeSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/forge/sessions');
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
    };

    fetchSessions();
  }, []);

  // Auto-navigate to most recent session if one exists
  useEffect(() => {
    if (!loading && sessions.length > 0) {
      // Navigate to the most recent session
      router.push(`/forge/${sessions[0].id}`);
    }
  }, [loading, sessions, router]);

  // Create new session
  const handleCreateSession = async () => {
    try {
      const response = await fetch('/api/forge/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Session ${new Date().toLocaleDateString()}` }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/forge/${data.session.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className={styles.homePage}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◇</div>
          <span className={styles.emptyTitle}>Welcome to Forge</span>
          <span className={styles.emptyText}>
            Create your first session to start generating videos from images
          </span>
          <button className={styles.createButton} onClick={handleCreateSession}>
              CREATE SESSION
            </button>
        </div>
      ) : (
        // While redirecting, show loading state
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Opening session...</span>
        </div>
      )}
    </div>
  );
}
