'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface SystemPrompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PromptsPage() {
  const router = useRouter();
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '', content: '' });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    } else if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Fetch prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/admin/prompts');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch prompts`);
        }
        const data = await response.json();
        setPrompts(data.prompts || []);
      } catch (err) {
        console.error('[Prompts] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prompts');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchPrompts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Handle edit prompt
  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setEditContent(prompt.content);
    setShowNewForm(false);
  };

  // Handle save
  const handleSave = async () => {
    if (!editingPrompt) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/prompts/${editingPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const data = await response.json();
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? data.prompt : p));
      setEditingPrompt(null);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle create new prompt
  const handleCreate = async () => {
    if (!newPrompt.name || !newPrompt.content) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create');
      }

      const data = await response.json();
      setPrompts(prev => [...prev, data.prompt]);
      setNewPrompt({ name: '', description: '', content: '' });
      setShowNewForm(false);
    } catch (err) {
      console.error('Create error:', err);
      alert(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrompts(prev => prev.filter(p => p.id !== id));
        if (editingPrompt?.id === id) {
          setEditingPrompt(null);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (prompt: SystemPrompt) => {
    try {
      const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !prompt.is_active }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrompts(prev => prev.map(p => p.id === prompt.id ? data.prompt : p));
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <span>LOADING...</span>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className={styles.loading}>
        <span>ACCESS DENIED</span>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerPrefix}>//</span>
          System Prompts
        </div>
        <button
          className={styles.newButton}
          onClick={() => {
            setShowNewForm(true);
            setEditingPrompt(null);
          }}
        >
          + New Prompt
        </button>
      </div>

      <div className={styles.layout}>
        {/* Prompts List */}
        <div className={styles.promptList}>
          {error ? (
            <div className={styles.error}>{error}</div>
          ) : prompts.length === 0 ? (
            <div className={styles.empty}>No prompts configured</div>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`${styles.promptItem} ${editingPrompt?.id === prompt.id ? styles.active : ''}`}
                onClick={() => handleEdit(prompt)}
              >
                <div className={styles.promptHeader}>
                  <div className={styles.promptName}>{prompt.name}</div>
                  <div className={styles.promptActions}>
                    <button
                      className={`${styles.statusBadge} ${prompt.is_active ? styles.badgeActive : styles.badgeInactive}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(prompt);
                      }}
                    >
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(prompt.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {prompt.description && (
                  <div className={styles.promptDesc}>{prompt.description}</div>
                )}
                <div className={styles.promptPreview}>
                  {prompt.content.slice(0, 100)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Editor Panel */}
        <div className={styles.editorPanel}>
          {showNewForm ? (
            <>
              <div className={styles.editorHeader}>
                <div className={styles.editorTitle}>New Prompt</div>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setShowNewForm(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.editorContent}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Name (unique identifier)</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., archivist_greeting"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Description (optional)</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={newPrompt.description}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Human-readable description"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Prompt Content</label>
                  <textarea
                    className={styles.promptTextarea}
                    value={newPrompt.content}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter the system prompt..."
                  />
                </div>
              </div>
              <div className={styles.editorFooter}>
                <button
                  className={styles.saveButton}
                  onClick={handleCreate}
                  disabled={isSaving || !newPrompt.name || !newPrompt.content}
                >
                  {isSaving ? 'Creating...' : 'Create Prompt'}
                </button>
              </div>
            </>
          ) : editingPrompt ? (
            <>
              <div className={styles.editorHeader}>
                <div className={styles.editorTitle}>{editingPrompt.name}</div>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setEditingPrompt(null)}
                >
                  ✕
                </button>
              </div>
              {editingPrompt.description && (
                <div className={styles.editorDesc}>{editingPrompt.description}</div>
              )}
              <div className={styles.editorContent}>
                <textarea
                  className={styles.promptTextarea}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
              <div className={styles.editorFooter}>
                <div className={styles.editorMeta}>
                  Last updated: {new Date(editingPrompt.updated_at).toLocaleDateString()}
                </div>
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={isSaving || editContent === editingPrompt.content}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.editorEmpty}>
              <div className={styles.editorEmptyIcon}>◇</div>
              <div className={styles.editorEmptyText}>
                Select a prompt to edit or create a new one
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

