'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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

  // Start editing a session name
  const handleStartEdit = (session: ForgeSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name);
    // Focus input after render
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  // Save renamed session
  const handleSaveRename = async () => {
    if (!editingSessionId || !editingName.trim() || saving) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/forge/sessions/${editingSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      
      if (response.ok) {
        // Update local state
        setSessions(prev => 
          prev.map(s => 
            s.id === editingSessionId 
              ? { ...s, name: editingName.trim() } 
              : s
          )
        );
        setEditingSessionId(null);
        setEditingName('');
      }
    } catch (error) {
      console.error('Failed to rename session:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle rename input keydown
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setEditingName('');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this session? All generations will be permanently deleted.')) {
      return;
    }
    
    setDeleting(sessionId);
    try {
      const response = await fetch(`/api/forge/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // If we're deleting the current session, navigate away
        if (currentSessionId === sessionId) {
          router.push('/forge');
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeleting(null);
    }
  };

  // Get current session name for the label
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentSessionName = currentSession?.name || 'Session';
  const currentSessionDate = currentSession 
    ? new Date(currentSession.created_at).toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : '';

  return (
    <div className={styles.sidebarContainer}>
      {/* Session Label - above the sidebar */}
      {currentSessionId && (
        <div className={styles.sessionLabel}>
          <span className={styles.sessionLabelTitle}>{currentSessionName}</span>
          <span className={styles.sessionLabelDate}>{currentSessionDate}</span>
        </div>
      )}

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
              <div key={session.id} className={styles.sessionItemWrapper}>
                <div
                  className={`${styles.sessionItem} ${
                    currentSessionId === session.id ? styles.sessionActive : ''
                  }`}
                  onClick={() => router.push(`/forge/${session.id}`)}
                  title={session.name}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      router.push(`/forge/${session.id}`);
                    }
                  }}
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
                </div>

                {/* Action buttons - outside the clickable div */}
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={(e) => handleStartEdit(session, e)}
                    title="Rename session"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path 
                        d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" 
                        stroke="currentColor" 
                        strokeWidth="1.2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    title="Delete session"
                    disabled={deleting === session.id}
                  >
                    {deleting === session.id ? (
                      <span className={styles.deletingDot} />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path 
                          d="M2 3H10M4 3V2H8V3M5 5V9M7 5V9M3 3L3.5 10H8.5L9 3" 
                          stroke="currentColor" 
                          strokeWidth="1.2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Session Info (shown on hover) */}
                <div className={styles.sessionInfo}>
                  {editingSessionId === session.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={handleSaveRename}
                      className={styles.renameInput}
                      disabled={saving}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className={styles.sessionName}>{session.name}</span>
                      <span className={styles.sessionCount}>
                        {session.completed_count} / {session.generation_count}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
