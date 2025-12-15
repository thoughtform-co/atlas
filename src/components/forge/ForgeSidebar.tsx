'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './ForgeSidebar.module.css';

interface ForgeSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  generation_count: number;
  completed_count: number;
  thumbnail_url: string | null;
}

export function ForgeSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ForgeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  // Extract current session ID from path
  const currentSessionId = pathname.startsWith('/forge/') 
    ? pathname.split('/')[2] 
    : null;

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Create new session
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/forge/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewSessionName('');
        setShowNewInput(false);
        await fetchSessions();
        // Navigate to new session
        router.push(`/forge/${data.session.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSession();
    } else if (e.key === 'Escape') {
      setShowNewInput(false);
      setNewSessionName('');
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* New Session Button */}
      <button 
        className={styles.newButton}
        onClick={() => setShowNewInput(true)}
        title="New Session"
      >
        <span className={styles.newIcon}>+</span>
      </button>

      {/* New Session Input */}
      {showNewInput && (
        <div className={styles.newInputContainer}>
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Session name..."
            className={styles.newInput}
            autoFocus
            disabled={creating}
          />
        </div>
      )}

      {/* Session List */}
      <div className={styles.sessionList}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        ) : sessions.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyText}>No sessions</span>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              className={`${styles.sessionItem} ${
                currentSessionId === session.id ? styles.sessionActive : ''
              }`}
              onClick={() => router.push(`/forge/${session.id}`)}
              title={session.name}
            >
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                {session.thumbnail_url ? (
                  <video
                    src={session.thumbnail_url}
                    className={styles.thumbnailVideo}
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <span>{session.completed_count}</span>
                  </div>
                )}
              </div>

              {/* Session Info (shown on hover) */}
              <div className={styles.sessionInfo}>
                <span className={styles.sessionName}>{session.name}</span>
                <span className={styles.sessionCount}>
                  {session.completed_count} / {session.generation_count}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
